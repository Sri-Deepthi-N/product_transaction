import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PieController, ArcElement } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PieController, ArcElement);
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Number of Items',
        data: [],
        backgroundColor: 'rgba(75,192,192,0.6)',
      }
    ]
  });
  const [pieChartData, setPieChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Categories',
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2', '#00BFFF', '#7FFF00', '#FFA500', '#20B2AA', '#CD5C5C', '#BA55D3'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2', '#00BFFF', '#7FFF00', '#FFA500', '#20B2AA', '#CD5C5C', '#BA55D3']
      }
    ]
  });
  const [month, setMonth] = useState('March');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/transactions', {
        params: {
          month,
          page,
        }
      });
      setTransactions(response.data.transactions);
      setFilteredTransactions(response.data.transactions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:3000/statistics', {
        params: { month }
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBarChartData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/barchart', {
        params: { month }
      });

      if (response.data && Array.isArray(response.data)) {
        const labels = response.data.map(item => item.range);
        const data = response.data.map(item => item.count);

        setBarChartData({
          labels,
          datasets: [
            {
              label: 'Number of Items',
              data,
              backgroundColor: 'rgba(75,192,192,0.6)',
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  const fetchPieChartData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/piechart', {
        params: { month }
      });

      if (response.data && Array.isArray(response.data)) {
        const categories = response.data.map(item => item.category);
        const data = response.data.map(item => item.count);

        setPieChartData({
          labels: categories,
          datasets: [
            {
              label: 'Categories',
              data,
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2', '#00BFFF', '#7FFF00', '#FFA500', '#20B2AA', '#CD5C5C', '#BA55D3'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2', '#00BFFF', '#7FFF00', '#FFA500', '#20B2AA', '#CD5C5C', '#BA55D3']
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching pie chart data:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
    fetchPieChartData(); 
  }, [month, page]);

  useEffect(() => {
    const filtered = transactions.filter(transaction =>
      transaction.title.toLowerCase().includes(search.toLowerCase()) ||
      transaction.description.toLowerCase().includes(search.toLowerCase()) ||
      transaction.price.toString().includes(search)
    );
    setFilteredTransactions(filtered);
  }, [search, transactions]);

  const handleMouseEnter = (imageUrl) => {
    setHoveredImage(imageUrl);
    setShowEnlargedImage(true);
  };
  const handleClickOnImage = () => {
    setShowEnlargedImage(false); 
  };

  return (
    <div className="container">

      <div className="controls">
        {/* Search */}
        <div className="control search-control">
          <label htmlFor="searchBox">Search Transactions</label>
          <input id="searchBox" type="text" placeholder="Search by title, description or price" value={search} onChange={e => setSearch(e.target.value)}/><br/>
          <button onClick={() => setSearch('')} className="clear-button">Clear Search</button><br/>
        </div>

        {/* Dropdown */}
        <div className="control">
          <label htmlFor="monthSelect">Select Month</label><br/>
          <select id="monthSelect" value={month} onChange={e => setMonth(e.target.value)}>
            {months.map((m, index) => (
              <option key={index} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Price</th>
              <th>Description</th>
              <th>Image</th>
              <th>Category</th>
              <th>Sold</th>
              <th>Date of Sale</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.title}</td>
                <td>{transaction.price}</td>
                <td>{transaction.description}</td>
                <td>
                  <div
                    className="image-container"
                    onMouseEnter={() => handleMouseEnter(transaction.image)}
                  >
                    <img
                      src={transaction.image}
                      alt={transaction.title}
                      className="transaction-image"
                      style={{ width: '50px', height: 'auto' }}
                    />
                    {showEnlargedImage && hoveredImage === transaction.image && (
                      <div className="image-overlay" onClick={handleClickOnImage}>
                        <img
                          src={transaction.image}
                          alt={transaction.title}
                          className="expanded-image"
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td>{transaction.category}</td>
                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</button>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      </div>

      {/*Bar-Chart*/}
      <div className="statistics">
        <h3>Statistics</h3>
        <p>Total Sale Amount: ${statistics.totalSaleAmount}</p>
        <p>Total Sold Items: {statistics.totalSoldItems}</p>
        <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
      </div>

      <div className="chart-container">
        <div className="bar-chart" style={{ width: '50%', margin: '0 auto', marginTop:'100px' }}>
          <h3>Bar Chart</h3>
          <Bar data={barChartData} options={{ responsive: true }} />
        </div>

        {/* Pie-Chart */}
        <div className="pie-chart" style={{ width: '25%', margin: '0 auto', marginTop:'100px' }}>
          <h3>Pie Chart</h3>
          <Pie data={pieChartData} options={{ responsive: true }} />
        </div>
      </div>

    </div>
  );
};

export default App;
