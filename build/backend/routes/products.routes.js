const express = require('express');
const router = express.Router();
const config = require('../config/db.config');
require('dotenv').config();

const executeQuery = (query, params, callback) => {
    config.query(query, params, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
};

router.get('/products/:categoryName', (req, res) => {
    const categoryName = req.params.categoryName.toLowerCase();

    const query = `
        SELECT p.ProductID, p.ProductName, p.Description, p.Price, p.Image, p.MainIngredients, c.CategoryName
        FROM Product p
        JOIN Category c ON p.CategoryID = c.CategoryID
        WHERE p.IsActive = 1
        AND LOWER(c.CategoryName) = ?
        ORDER BY p.ProductName
    `;

    executeQuery(query, [categoryName], (err, products) => {
        if (err) {
            req.flash('error', 'Unable to fetch products. Please try again.');
            return res.redirect('/');
        }
        if (products.length === 0) {
            return res.sendStatus(404);
        }
        res.render('products/category', {
            title: 'Products',
            category: products[0].CategoryName,
            categoryName,
            products,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error')
        });
    });
});

router.get('/products/:categoryName/:productID', (req, res) => {
    const categoryName = req.params.categoryName.toLowerCase();
    const productId = parseInt(req.params.productID, 10);

    if (isNaN(productId)) {
        return res.status(400).send('Invalid product ID');
    }

    const query = `
        SELECT
            p.ProductID,
            p.ProductName,
            p.Description,
            p.Price,
            p.Image,
            p.MainIngredients,
            c.CategoryName,
            GROUP_CONCAT(sc.SkinClassificationName SEPARATOR ', ') AS SkinClassificationNames
        FROM Product p
        JOIN Category c ON p.CategoryID = c.CategoryID
        LEFT JOIN ProductSkinClassification psc ON p.ProductID = psc.ProductID
        LEFT JOIN SkinClassification sc ON psc.SkinClassificationID = sc.SkinClassificationID
        WHERE p.IsActive = 1
        AND p.ProductID = ?
        AND LOWER(c.CategoryName) = ?
        GROUP BY
            p.ProductID,
            p.ProductName,
            p.Description,
            p.Price,
            p.Image,
            p.MainIngredients,
            c.CategoryName
    `;

    executeQuery(query, [productId, categoryName], (err, rows) => {
        if (err) {
            req.flash('error', 'Unable to fetch product. Please try again.');
            return res.redirect('/');
        }
        const product = rows[0];
        if (!product) {
            return res.sendStatus(404);
        }
        res.render('products/product', {
            title: 'Product Details',
            category: product.CategoryName,
            product,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error')
        });
    });
});

module.exports = router;
