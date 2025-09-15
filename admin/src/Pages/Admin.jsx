import React from "react";
import "./CSS/Admin.css";
import Sidebar from "../Components/Sidebar/Sidebar";
import AddProduct from "../Components/AddProduct/AddProduct";
import { Route, Routes } from "react-router-dom";
import ListProduct from "../Components/ListProduct/ListProduct";
import Coupons from "../Components/Coupons/Coupons";
import Analysis from "../Components/Analysis/Analysis";
import Payments from "../Components/Payments/Payments";

const Admin = () => {

  return (
    <div className="admin">
      <Sidebar />
      <Routes>
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/listproduct" element={<ListProduct />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/payments" element={<Payments />} />
      </Routes>
    </div>
  );
};

export default Admin;
