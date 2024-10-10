const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
 
function priceValidate(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function dishValidate(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function bodyValidate(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function idValidate(req, res, next) {
  const dish = res.locals.dish;
  const dishId = req.body.data.id;
  if (!dishId || (dishId && dish.id === dishId)) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${dishId}, Route: ${dish.id}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

module.exports = {
  create: [
    bodyValidate("name"),
    bodyValidate("description"),
    bodyValidate("price"),
    bodyValidate("image_url"),
    priceValidate,
    create,
  ],
  read: [dishValidate, read],
  update: [
    dishValidate,
    idValidate,
    bodyValidate("name"),
    bodyValidate("description"),
    bodyValidate("price"),
    bodyValidate("image_url"),
    priceValidate,
    update,
  ],
  list,
};