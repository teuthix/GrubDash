const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    const {dishId} = req.params;
    res.json({ data: orders.filter(dishId ? order => order.id == dishId : () => true )})
}

function bodyDataHas(propertyName){
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Missing ${propertyName} in new order`
        });
    }
}

function validDishes(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish) => {
        if(dish.quantity && Number.isInteger(dish.quantity) && dish.quantity > 0) {
            next();
        }
        next({
            status: 400,
            message: "needs a quantity of dishes"
        });
    })
}

function hasValidQuantity(req, res, next) {
    const {data: {dishes} = {} } = req.body;
    if(dishes[quantity] && quantity > 0) {
        return next();
    }
    next({
        status: 400,
        message: `needs valid quantity`
    });
}

function create(req, res, next) {
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo, mobileNumber, status, dishes,
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `No order with Id ${orderId}`
    });
}

function read(req, res) {
    res.json({data: res.locals.order});
}

function update(req, res, next) {
    const order = res.locals.dish;
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;

    order.deliverTo = deliverTo;
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validDishes,
        hasValidQuantity,
        create
    ],
    read: [orderExists, read],
}