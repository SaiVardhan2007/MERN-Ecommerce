import React, { useEffect, useRef, useState } from 'react';
import { backend_url } from '../../App';
import './Analysis.css';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const Analysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryCounts, setCategoryCounts] = useState({});

  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${backend_url}/allproducts`);
        const products = await res.json();
        const counts = {};
        products.forEach((p) => {
          const key = (p.category || 'uncategorized').toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        });

        setCategoryCounts(counts);
      } catch (e) {
        console.error('Failed to fetch products for analysis:', e);
        setError('Failed to load analysis data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const categories = Object.keys(categoryCounts);
    const values = Object.values(categoryCounts);

    if (categories.length === 0) return;

    const baseColors = [
      '#42A5F5', // blue
      '#66BB6A', // green
      '#FFA726', // orange
      '#EF5350', // red
      '#AB47BC', // purple
      '#26C6DA', // cyan
      '#8D6E63', // brown
      '#D4E157', // lime
      '#FF7043', // deep orange
      '#29B6F6'  // light blue
    ];

    const backgroundColors = categories.map((_, i) => baseColors[i % baseColors.length]);

    const ctx = canvasRef.current.getContext('2d');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Products by Category',
            data: values,
            backgroundColor: backgroundColors,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 16,
              boxHeight: 16,
              font: { size: 14 },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [categoryCounts]);

  return (
    <div className="analysis">
      <div className="analysis-header">
        <h1>Analysis</h1>
        <p>Product category distribution (pie chart)</p>
      </div>

      {loading && <div className="analysis-status">Loading chart...</div>}
      {error && <div className="analysis-error">{error}</div>}

      {!loading && !error && (
        <div className="analysis-chart-wrapper">
          {/* Canvas element used by Chart.js to render the pie chart */}
          <canvas ref={canvasRef} />
        </div>
      )}

      {/*
        Notes:
        - This chart uses only Chart.js and plain JavaScript (no extra chart wrappers).
        - Data is fetched from `${backend_url}/allproducts` and grouped by `category`.
        - Each pie slice's size is proportional to the number of products in that category.
      */}
    </div>
  );
};

export default Analysis; 