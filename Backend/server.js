const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://deepthi:XzECB1Mdq7c3H6Up@cluster0.gywnnad.mongodb.net/Project1').then(() => {
  console.log("Connected to MongoDB");
  //seedDatabase();
})

// Schema & model
const DataSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  sold: { type: Boolean, required: true },
  dateOfSale: { type: Date, required: true }
});
const Data = mongoose.model('Data', DataSchema);

// Seed database function
// async function seedDatabase() {
//   try {
//     const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
//     const products = response.data; // Assuming the API response is an array of products

//     await Data.insertMany(products);
//   } catch (error) {
//     console.error('Error during seeding process:', error);
//   }
// }

// Pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;


// Function to build a date query based on the selected month
function buildDateQuery(month) {
  if (!month) return {};

  const monthIndex = new Date(`${month} 1, 2000`).getMonth(); // Get the month index (0-11)
  return {
    $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] }
  };
}


app.get('/transactions', async (req, res) => {
  const { page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE, searchText, month } = req.query;
  const skip = (page - 1) * perPage;

  let searchQuery = {};
  if (searchText) {
    searchQuery = {
      $or: [
        { title: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
        { price: parseFloat(searchText) }
      ]
    };
  }

  const dateQuery = buildDateQuery(month); // Build date query

  try {
    const totalTransactions = await Data.countDocuments({ ...searchQuery, ...dateQuery });
    const transactions = await Data.find({ ...searchQuery, ...dateQuery })
      .skip(skip)
      .limit(perPage);

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.json({
      transactions,
      page: parseInt(page),
      perPage: parseInt(perPage),
      totalPages: Math.ceil(totalTransactions / perPage),
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
});


// statistics
app.get('/statistics', async (req, res) => {
  const { month } = req.query;
  const dateQuery = buildDateQuery(month);

  try {
    const totalSaleAmount = await Data.aggregate([
      { $match: dateQuery },
      { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    ]);

    const totalSoldItems = await Data.countDocuments({ ...dateQuery, sold: true });
    const totalNotSoldItems = await Data.countDocuments({ ...dateQuery, sold: false });

    res.json({
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Error retrieving statistics' });
  }
});

// bar chart data
app.get('/barchart', async (req, res) => {
  const { month } = req.query;
  const dateQuery = buildDateQuery(month);

  const priceRanges = [
    [0, 100], [101, 200], [201, 300], [301, 400], [401, 500],
    [501, 600], [601, 700], [701, 800], [801, 900], [901, Infinity]
  ];

  try {
    const barChartData = await Promise.all(priceRanges.map(async ([min, max]) => {
      const count = await Data.countDocuments({
        ...dateQuery,
        price: { $gte: min, $lt: max === Infinity ? max : max + 1 }
      });
      return { range: `${min}-${max === Infinity ? 'above' : max}`, count };
    }));

    res.json(barChartData);
  } catch (err) {
    console.error('Error fetching bar chart data:', err);
    res.status(500).json({ message: 'Error retrieving bar chart data' });
  }
});

// pie chart data
app.get('/piechart', async (req, res) => {
  const { month } = req.query;
  const dateQuery = buildDateQuery(month);

  try {
    const pieChartData = await Data.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } }
    ]);

    res.json(pieChartData);
  } catch (err) {
    console.error('Error fetching pie chart data:', err);
    res.status(500).json({ message: 'Error retrieving pie chart data' });
  }
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
});