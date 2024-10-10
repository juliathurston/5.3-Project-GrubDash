const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


// Middleware

function dishQuantValidate(req, res, next) {
  const dishes = req.body.data.dishes;
  let index = -1;
  for (let i = 0; i < dishes.length; i++) {
    const quantity = dishes[i].quantity;
    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      index = i;
      break;
    }
  }
  if (index > -1) {
    return next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order not found: ${orderId}` });
}

function bodyValidate(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function statusPending(req, res, next) {
  const status = res.locals.order.status;
  if (status === "pending") return next();
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function idIdentical(req, res, next) {
  const order = res.locals.order;
  const orderId = req.body.data.id;
  if (!orderId || (orderId && order.id === orderId)) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${order.id}, Route: ${orderId}.`,
  });
}

function statusValidate(req, res, next) {
  const {
    data: { status },
  } = req.body;
  const validValues = new Set([
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ]);
  if (status && validValues.has(status) && status !== "delivered") {
    return next();
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function dishesValidate(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({ status: 400, message: "Order must include at least one dish" });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function list(req, res) {
  res.json({ data: orders });
}

function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res) {
  const orderId = res.locals.id;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyValidate("deliverTo"),
    bodyValidate("mobileNumber"),
    bodyValidate("dishes"),
    dishesValidate,
    dishQuantValidate,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    idIdentical,
    bodyValidate("deliverTo"),
    bodyValidate("mobileNumber"),
    bodyValidate("dishes"),
    dishesValidate,
    dishQuantValidate,
    statusValidate,
    update,
  ],
  delete: [orderExists, statusPending, destroy],
  list,
};