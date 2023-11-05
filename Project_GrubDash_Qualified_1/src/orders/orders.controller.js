const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// get for "/"
function list(req, res) {
    const {dishId} = req.params;
    res.json({ data: orders.filter(dishId ? order => order.id == dishId : () => true )})
}

// checks that each property in orders exists
function bodyDataHas(propertyName){
    return function validateProperty(req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    };
}

// checks that there are dishes, more than 0, and is an array
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

// if dishes has a quantity, that its an integer, and is > 0
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

// create a new order
// uses bodyDataHas, validDishes, hasValidQuantity
function create(req, res, next) {
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo, mobileNumber, status, dishes,
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

// checks that the orderId in the params matches an order
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

// get for "/:orderId"
// uses orderExists
function read(req, res) {
    res.json({data: res.locals.order});
}

// checks that data has an id property and it matches :orderId
function idMatches(req, res, next){
    const { orderId } = req.params;
    const { data: {id} = {}} = req.body;
    if(id && id !== orderId){
        next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        });
    }
    next(); 
}

// check that status property exists and has text
function checkStatus(req, res, next) {
    const { data: {status} = {} } = req.body;
    if(!status || status == "pending" || status == "preparing" || status == "out-for-delivery" || status == "delivered") {
        next();
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

// put for ":orderId"
// uses orderExists, bodyDataHas, idMatches, validDishes, hasValidQuantity,
function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

// checks if status is pending and if it isn't throws error
function statusPending(req, res, next) {
    const order = res.locals.order;
    if(order.status !== 'pending'){
        next({
        status: 400,
        message: "An order cannot be deleted unless it is pending."
    });
    }
    next();
}

// deletes order if status is pending
// uses orderExists, statusPending
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
        checkStatus,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        idMatches,
        validDishes,
        hasValidQuantity,
        update],
    destroy: [orderExists, statusPending, destroy],
}