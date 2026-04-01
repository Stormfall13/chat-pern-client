import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleFavoriteLocally } from "../store/slices/favoriteSlice";
import { Link } from "react-router-dom";

import noPhoto from "../assets/no-photo.png";

import CommentsProdPage from "../components/ProductPageUtils/CommentsProdPage";
import QnAProductPage from "../components/ProductPageUtils/QnAProductPage";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTabProduct, setActiveTabProduct] = useState("description");
  const favoriteIds = useSelector(state => state.favorites.ids);

  // Функции для навигации слайдера
  const nextImage = () => {
    const images = product?.images || [];
    if (images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    const images = product?.images || [];
    if (images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };
  
  useEffect(() => {
     // Загрузка товара
    fetch(`${process.env.REACT_APP_API_URL}/api/products/${id}`)
      .then(res => res.json())
      .then(data => setProduct(data))
      .catch(err => console.error("Ошибка загрузки товара", err));

  }, [id]);

  const handleAddToCart = async () => {
    if (quantity > product.stock) {
      alert(`❌ Недостаточно товаров на складе. Всего доступно: ${product.stock}`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Товар добавлен в корзину");
      } else {
        // console.error("Ошибка добавления", data);
        alert("❌ Не удалось добавить товар в корзину");
      }
      if (!response.ok) {
        if (response.status === 400) {
          setError(data.message); // сообщение от сервера
        } else {
          setError("Ошибка при добавлении в корзину");
        }
        return;
      }
      setError(""); // сброс если всё ок
    } catch (err) {
      console.error("Ошибка при добавлении в корзину", err);
      alert("❌ Произошла ошибка");
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleQuantityChange = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > product.stock) {
      alert(`❌ Недостаточно товаров на складе. Всего: ${product.stock}`);
      setQuantity(product.stock);
    } else {
      setQuantity(value);
    }
  };


  const toggleFavorite = async (productId) => {
      const token = localStorage.getItem("token");
      if (!token) {
          alert("Для добавления в избранное нужно войти");
          return;
      }

      const isFavorite = favoriteIds.includes(productId);

      try {
          const response = await fetch(
              `${process.env.REACT_APP_API_URL}/api/favorites/${isFavorite ? 'remove/' : 'add/'}${productId}`,
              {
                  method: isFavorite ? "DELETE" : "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
              }
          );

          if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || "Ошибка работы с избранным");
          }

          dispatch(toggleFavoriteLocally(productId));
      } catch (err) {
          alert(err.message);
      }
  };

  if (!product) return <div>Загрузка...</div>;

  const images = product.images && product.images.length > 0 
  ? product.images 
  : product.image 
    ? [product.image] 
    : [];

  const currentImage = images.length > 0 
    ? `${process.env.REACT_APP_API_URL}${images[currentImageIndex].startsWith("/") ? "" : "/uploads/"}${images[currentImageIndex]}`
    : noPhoto;

  return (
    <>
    <div style={{ padding: 20 }} className="wrapp__product-page">
      <h1>{product.nameProd}</h1>
        {/* СЛАЙДЕР С ИЗОБРАЖЕНИЯМИ */}
        <div className="product__slider">
          <div className="slider__control-panel">

            {/* Миниатюры */}
            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, index) => (
                  <div
                    className="thumbnails__mini"
                    key={index}
                    onClick={() => goToImage(index)}
                    style={{
                      border: `2px solid ${index === currentImageIndex ? "#007bff" : "#ddd"}`,
                      backgroundColor: index === currentImageIndex ? "#f0f8ff" : "white",
                      transition: "all 0.6s ease",
                      overflow: "hidden",
                      width: '60px',
                      height: '60px',
                    }}
                  >
                    <img
                      src={`${process.env.REACT_APP_API_URL}${img.startsWith("/") ? "" : "/uploads/"}${img}`}
                      alt={`Thumbnail ${index + 1}`}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Кнопки навигации */}
            {images.length > 1 && (
              <div className="slider__btn-wrapp">
                <button onClick={prevImage}>Лево</button>
                
                <button onClick={nextImage}>Право</button>
              </div>
            )}
          </div>
          {/* Основное изображение */}
          <div className="main__image-container">
            <img src={currentImage} alt={`${product.nameProd}`}/>
          </div>
        </div>
      <p><strong>Количество на складе:</strong> {product.stock}</p>
      <p><strong>Цена:</strong> {product.price} $</p>
      <p><strong>Категория:</strong> {product.Category?.name || "Без категории"}</p>
      <div>{product.isHit ? 'Хит' : ''}</div>
      <div>{product.isNew ? 'Новинка' : ''}</div>
      <div>{product.isSale ? 'Акция' : ''}</div>
      {/* Размеры */}
      {product.sizes && product.sizes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Размеры:</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {product.sizes.map((size, index) => (
              <div 
                key={index}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  backgroundColor: "#f5f5f5"
                }}
              >
                {size}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Цвета */}
      {product.colors && product.colors.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Цвета:</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {product.colors.map((color, index) => (
              <div 
                key={index}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "1px solid #ddd",
                  cursor: "pointer"
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
      <div className="tabs__panel">
          <button onClick={() => setActiveTabProduct('description')}>Description</button>
          <button onClick={() => setActiveTabProduct('userComments')}>User Comments</button>
          <button onClick={() => setActiveTabProduct('qna')}>Question & Answer</button>
      </div>
      {activeTabProduct === 'description' && (
          <>
          {product.description && (
              <p className="description__prod">{product.description}</p>
          )}
          </>
      )}
      {/* КОММЕНТАРИИ */}
      {activeTabProduct === 'userComments' && (
          <CommentsProdPage />
      )}
      {/* ВОПРОС И ОТВЕТ */}
      {activeTabProduct === 'qna' && (
          <QnAProductPage />
      )}
      {error && (
          <div style={{ color: "red", margin: "10px 0" }}>
          {error}
          </div>
      )}
      <Link className='prod__brand' to={`/brand/${product.brand}`}>{product.brand}</Link>
      <button onClick={() => toggleFavorite(product.id)}>
          {favoriteIds.includes(product.id) ? "★ В избранном" : "☆ В избранное"}
      </button>
      <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
        <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} disabled={quantity <= 1}>-</button>
        <input
          type="text"
          min="1"
          max={product.stock}
          value={quantity}
          onChange={handleQuantityChange}
          style={{ margin: "0 10px", width: 60, textAlign: "center" }}
        />
        <button onClick={() => {
          if (quantity < product.stock) setQuantity(prev => prev + 1);
          else alert(`❌ Недостаточно товаров на складе. Всего: ${product.stock}`);
        }}>
          +
        </button>
      </div>
      {error && (
        <div style={{ color: "red", margin: "10px 0" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleAddToCart}
        style={{ marginTop: 20, padding: "10px 20px" }}
      >
        Добавить в корзину
      </button>
    </div>
    </>
  );
};

export default ProductPage;
