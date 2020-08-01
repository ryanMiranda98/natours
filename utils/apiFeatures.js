class APIFeatures {
  // query => query object
  // queryString => query result
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1. Basic Filtering
    const queryObj = { ...this.queryString };
    // These keywords need to be deleted from the query first
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2. Advanced Filtering
    // In postman, request will look like duration[gte]=5
    // result query => {difficulty: 'easy', duration: {gte: 5}}
    // need to make query like this => {difficulty: 'easy', duration: {$gte: 5}}
    // Replace gte|gt|lte|lt with $gte....
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // RETURNS query object
    // find is js find(), not mongoose
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 3. Sorting - TO FIX
    if (this.queryString.sort) {
      // postman => sort=price,ratingsAverage
      // mongoose query => sort=price ratingsAverage
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    // 4. Limiting Fields
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    // 5. Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip > numTours) throw new Error("This page does not existF");
    // }
    return this;
  }
}

module.exports = APIFeatures;
