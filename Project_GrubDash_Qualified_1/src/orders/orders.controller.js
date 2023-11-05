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
    if(dishes && dishes.length && Array.isArray(dishes)) {
        next();
    }
    next({
        status: 400,
        message: "needs dishes"
    });
}

function hasValidQuantity(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish, index) => {
        if(!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    })
    next();
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

function validOrderProperty(propertyName){
    return function (req, res, next) {
        const { data: {dishes} = {} } = req.body;
        if(dishes[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `missing ${propertyName}`
        })
    }
}

function update(req, res, next) {
    const order = res.locals.dish;
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;

    // order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

function statusPending(req, res, next) {
    // const { orderId } = req.params;
    const order = res.locals.order;
    console.log(order.status, "testtttt");
    if(order.status !== 'pending'){
        next({
        status: 400,
        message: "An order cannot be deleted unless it is pending."
    });
    }
    next();
}

function destroy(req, res) {
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    const deletedOrders = orders.splice(index, 1);

    res.sendStatus(204);
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
    update: [
        orderExists, 
        validOrderProperty("deliverTo"),
        validOrderProperty("mobileNumber"),
        validDishes,
        hasValidQuantity,
        update],
    destroy: [orderExists, statusPending, destroy],
}