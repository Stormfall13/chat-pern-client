import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BasketCount = () => {
  const [cart, setCart] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.CartItems)) {
        setCart(data);
        const count = data.CartItems.reduce((acc, item) => acc + item.quantity, 0);
        const price = data.CartItems.reduce(
          (acc, item) => acc + item.quantity * (item.Product?.price || 0),
          0
        );
        setTotalCount(count);
        setTotalPrice(price);
      } else {
        setCart({ CartItems: [] });
        setTotalCount(0);
        setTotalPrice(0);
      }
    } catch (err) {
      console.error("Ошибка загрузки корзины:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (totalCount === 0) {
    return <div>🛒 Товаров: 0</div>;
  }

  return (
    <div>
      <Link to="/basket">
        🛒 Товаров: {totalCount} | Сумма: {totalPrice} $
      </Link>
    </div>
  );
};

export default BasketCount;
