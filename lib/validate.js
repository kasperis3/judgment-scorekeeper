
function validate(input) {
  if (typeof input === "object") {
    let body = input.body;
    return Object.values(body).map(validate);
  }
  
  if (input && input.length === 0 || input === '') {
    return {
      msg: "you must enter some value",
    }
  } else if (!input.split("").every(p => p.match(/\d/))) {
    return {
      msg: "every char must be a numeric",
    }
  }
  return true;
  
};

module.exports = {
  validate: validate,
}