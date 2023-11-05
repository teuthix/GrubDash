const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// get for "/"
function list(req, res) {
    res.json({data: dishes});
}

// checks if the property is present
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `${propertyName} is missing`
        })
    }
}

// checks if the price is >= 0 and a number
function hasValidPrice(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price < 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: "price less than $0"
        });
    }
    next();
}

// post for "/"
// uses bodyDataHas, hasValidPrice
function create(req, res, next) {
    const { data: { name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name, description, price, image_url,
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

// checks if :dishId matches a dish in the data
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if (foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

// get for ":dishId"
// uses dishExists
function read(req, res, next) {
    res.json({data: res.locals.dish});
}

// checks that the :dishId matches the id of the data
function idMatches(req, res, next){
    const { dishId } = req.params;
    const { data: {id} = {}} = req.body;
    if(id && id !== dishId){
        next({
        status: 400,
        message: `doesn't match id ${id}`
        });
    }
    next(); 
}

// put for "/:dishId"
function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url} = {} } = req.body;

    // update the dish elements
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    // console.log({data: dish})
    res.json({ data: dish });
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        hasValidPrice,
        create
    ],
    read: [dishExists, read],
    update: [dishExists, 
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        hasValidPrice,
        idMatches,
        update,
    ],
}