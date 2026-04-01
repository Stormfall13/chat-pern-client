import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoryById } from "../store/slices/categorySlice";
import { fetchProductsByCategory } from "../store/slices/productsSlice";
import { fetchFavorites, toggleFavoriteLocally } from "../store/slices/favoriteSlice";
import { addToCart } from "../store/slices/cartSlice";
import { setInitialQuantities, increaseQuantity, decreaseQuantity, changeQuantity } from "../store/slices/quantitySlice";

import noPhoto from "../assets/no-photo.png";
import './categoryPage.css';

const CategoryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();

    const category = useSelector(state => state.category.data);
    const products = useSelector(state => state.products.list);
    const favoriteIds = useSelector(state => state.favorites.ids);

    const quantities = useSelector(state => state.quantities);

    // 🔹 СОСТОЯНИЯ ДЛЯ ФИЛЬТРОВ
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [selectedMinPrice, setSelectedMinPrice] = useState(0);
    const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [showFilters, setShowFilters] = useState(true); 

    // 🔹 ВЫЧИСЛЯЕМ ДАННЫЕ ДЛЯ ФИЛЬТРОВ
    const { allColors, allSizes, maxProductPrice } = useMemo(() => {
        if (!products.length) return { allColors: [], allSizes: [], maxProductPrice: 0 };

        // Получаем все уникальные цвета
        const colorsSet = new Set();
        products.forEach(product => {
            if (product.colors) {
                product.colors.forEach(color => colorsSet.add(color));
            }
        });

        // Получаем все уникальные размеры
        const sizesSet = new Set();
        products.forEach(product => {
            if (product.sizes) {
                product.sizes.forEach(size => sizesSet.add(size));
            }
        });

        // Находим максимальную цену
        const maxPrice = Math.max(...products.map(p => p.price), 0);

        return {
            allColors: Array.from(colorsSet),
            allSizes: Array.from(sizesSet),
            maxProductPrice: maxPrice
        };
    }, [products]);

    // 🔹 ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ ПРИ ЗАГРУЗКЕ ТОВАРОВ
    useEffect(() => {
        if (maxProductPrice > 0) {
            setMinPrice(0);
            setMaxPrice(maxProductPrice);
            setSelectedMinPrice(0);
            setSelectedMaxPrice(maxProductPrice);
        }
    }, [maxProductPrice]);

    // 🔹 ФИЛЬТРАЦИЯ ТОВАРОВ
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Фильтр по цене
            const priceMatch = product.price >= selectedMinPrice && product.price <= selectedMaxPrice;
            
            // Фильтр по цветам (если цвета выбраны)
            const colorMatch = selectedColors.length === 0 || 
                (product.colors && product.colors.some(color => selectedColors.includes(color)));
            
            // Фильтр по размерам (если размеры выбраны)
            const sizeMatch = selectedSizes.length === 0 || 
                (product.sizes && product.sizes.some(size => selectedSizes.includes(size)));
            
            return priceMatch && colorMatch && sizeMatch;
        });
    }, [products, selectedMinPrice, selectedMaxPrice, selectedColors, selectedSizes]);

    // 🔹 ОБРАБОТЧИКИ ФИЛЬТРОВ
    const handlePriceRangeChange = (e) => {
        const value = parseInt(e.target.value);
        setSelectedMaxPrice(value);
    };

    const handleMinPriceChange = (e) => {
        let value = parseInt(e.target.value) || 0;
        value = Math.max(0, Math.min(value, selectedMaxPrice));
        setSelectedMinPrice(value);
    };

    const handleMaxPriceChange = (e) => {
        let value = parseInt(e.target.value) || 0;
        value = Math.min(maxPrice, Math.max(value, selectedMinPrice));
        setSelectedMaxPrice(value);
    };

    const handleColorToggle = (color) => {
        setSelectedColors(prev => 
            prev.includes(color) 
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const handleSizeToggle = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) 
                ? prev.filter(s => s !== size)
                : [...prev, size]
        );
    };

    const handleResetFilters = () => {
        setSelectedMinPrice(0);
        setSelectedMaxPrice(maxPrice);
        setSelectedColors([]);
        setSelectedSizes([]);
    };

    useEffect(() => {
        dispatch(fetchCategoryById(id));
        dispatch(fetchProductsByCategory(id)).then((res) => {
            const initialQuantities = {};
            res.payload.forEach(prod => {
                initialQuantities[prod.id] = 1;
            });
            dispatch(setInitialQuantities(initialQuantities));
        });

        const token = localStorage.getItem("token");
        if (token) dispatch(fetchFavorites());
    }, [id, dispatch]);

    const handleAddToCart = async (productId, stock) => {
        const quantity = quantities[productId] || 1;
        if (quantity > stock) {
            alert(`Недостаточно товара на складе. Всего: ${stock}`);
            return;
        }
    
        dispatch(addToCart({ productId, quantity }))
            .unwrap()
            .then(() => {
                alert("Товар добавлен в корзину");
            })
            .catch((err) => {
                alert(err);
            });
    };

    const handleIncrease = (id, stock) => {
        dispatch(increaseQuantity({ productId: id, stock }));
    };
    
    const handleDecrease = (id) => {
        dispatch(decreaseQuantity({ productId: id }));
    };
    
    const handleQuantityChange = (e, id, stock) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value)) return;
        dispatch(changeQuantity({ productId: id, quantity: value, stock }));
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

    return (
        <>
        <h1>{category ? category.name : "Загрузка..."}</h1>
        {/* {favoriteIds.length > 0 && (
            <div className="test" style={{ marginBottom: 20 }}>
                <Link to="/favorites">Перейти в избранное ({favoriteIds.length})</Link>
            </div>
        )} */}
        <div className="category__wrapp" style={{ display: 'flex' }}>

            <div className="filter__wrapp">
                {/* 🔹 КНОПКА ПОКАЗАТЬ/СКРЫТЬ ФИЛЬТРЫ (для мобильных) */}
                {/* <button 
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ 
                        marginBottom: '20px', 
                        padding: '10px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                </button> */}

                {/* 🔹 ПАНЕЛЬ ФИЛЬТРОВ */}
                <div style={{ 
                    display: showFilters ? 'block' : 'none', 
                    background: '#bbb'
                }}>
                    <h3>Фильтры</h3>
                    
                    {/* 🔹 ФИЛЬТР ПО ЦЕНЕ */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Цена: до {selectedMaxPrice} ₽</h4>
                        <input
                            type="range"
                            min={minPrice}
                            max={maxPrice}
                            value={selectedMaxPrice}
                            onChange={handlePriceRangeChange}
                            style={{ width: '100%', maxWidth: '300px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <div>
                                <label>От: </label>
                                <input
                                    type="number"
                                    value={selectedMinPrice}
                                    onChange={handleMinPriceChange}
                                    min={0}
                                    max={selectedMaxPrice}
                                    style={{ width: '80px', padding: '5px' }}
                                />
                            </div>
                            <div>
                                <label>До: </label>
                                <input
                                    type="number"
                                    value={selectedMaxPrice}
                                    onChange={handleMaxPriceChange}
                                    min={selectedMinPrice}
                                    max={maxPrice}
                                    style={{ width: '80px', padding: '5px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 🔹 ФИЛЬТР ПО ЦВЕТАМ */}
                    {allColors.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Цвета</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {allColors.map(color => (
                                    <label key={color} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedColors.includes(color)}
                                            onChange={() => handleColorToggle(color)}
                                            style={{ marginRight: '5px' }}
                                        />
                                        <div 
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                border: '1px solid #ccc'
                                            }}
                                            title={color}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 🔹 ФИЛЬТР ПО РАЗМЕРАМ */}
                    {allSizes.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4>Размеры</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {allSizes.map(size => (
                                    <label key={size} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedSizes.includes(size)}
                                            onChange={() => handleSizeToggle(size)}
                                            style={{ marginRight: '5px' }}
                                        />
                                        {size}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 🔹 КНОПКА СБРОСА */}
                    <button 
                        onClick={handleResetFilters}
                        style={{
                            padding: '8px 15px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Сбросить фильтры
                    </button>

                    {/* 🔹 СЧЕТЧИК НАЙДЕННЫХ ТОВАРОВ */}
                    <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                        Найдено товаров: {filteredProducts.length}
                    </p>
                    {/* 🔹 СООБЩЕНИЕ ЕСЛИ ТОВАРЫ НЕ НАЙДЕНЫ */}
                    {filteredProducts.length === 0 && products.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <h3>Товары не найдены</h3>
                            <p>Попробуйте изменить параметры фильтра</p>
                            <button onClick={handleResetFilters}>Сбросить фильтры</button>
                        </div>
                    )}
                </div>


            </div>
            {filteredProducts.length === 0 ? (
                <div className="wrapp__prod" style={{ display: "flex", flexWrap: "wrap", maxWidth: 1024 + 'px', width: 100 + '%' }}>
                    {products.map((product) => (
                        <div key={product.id} className="wrapper__prod" style={{ maxWidth: "300px", width: "100%" }}>
                            <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                <h3>{product.nameProd}</h3>
                                <p>Цена: {product.price} $</p>
                                <div style={{ height: "200px", display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                                    <img
                                        src={
                                            product.images && product.images.length > 0 
                                                ? `${process.env.REACT_APP_API_URL}${product.images[0]}`
                                                : noPhoto
                                        }
                                        alt={product.nameProd}
                                        style={{ 
                                            maxWidth: "100%", 
                                            maxHeight: "100%", 
                                            objectFit: "contain" 
                                        }}
                                    />
                                </div>
                                <div>{product.isHit ? 'Хит' : ''}</div>
                                <div>{product.isNew ? 'Новинка' : ''}</div>
                                <div>{product.isSale ? 'Акция' : ''}</div>
                                <p>На складе: {product.stock}</p>
                                {/* Отображаем размеры, если они есть */}
                                {product.sizes && product.sizes.length > 0 && (
                                <div style={{ marginBottom: "10px" }}>
                                    <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Размеры:</p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                        {product.sizes.map((size, index) => (
                                            <span 
                                                key={index} 
                                                style={{
                                                    padding: "3px 8px",
                                                    background: "#f0f0f0",
                                                    borderRadius: "4px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Отображаем цвета, если они есть */}
                            {product.colors && product.colors.length > 0 && (
                                <div style={{ marginBottom: "10px" }}>
                                    <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Цвета:</p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                        {product.colors.map((color, index) => (
                                            <div 
                                                key={index}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "50%",
                                                    background: color,
                                                    border: "1px solid #ddd"
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            </Link>
                            <Link className='prod__brand' to={`/brand/${product.brand}`}>{product.brand}</Link>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button onClick={() => handleDecrease(product.id)}>-</button>
                                <input
                                type="text"
                                value={quantities[product.id] || 1}
                                onChange={(e) => handleQuantityChange(e, product.id, product.stock)}
                                style={{ width: 50 }}
                                />

                                <button onClick={() => handleIncrease(product.id, product.stock)}>+</button>
                            </div>

                            <button onClick={() => toggleFavorite(product.id)}>
                                {favoriteIds.includes(product.id) ? "★ В избранном" : "☆ В избранное"}
                            </button>

                            <button onClick={() => handleAddToCart(product.id, product.stock)}>Добавить в корзину</button>
                        </div>
                    ))}
                </div>
            ) : (
                // 🔹 ОТОБРАЖАЕМ ОТФИЛЬТРОВАННЫЕ ТОВАРЫ
                <div className="wrapp__prod" style={{ display: "flex", flexWrap: "wrap", maxWidth: 1024 + 'px', width: 100 + '%' }}>
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="wrapper__prod" style={{ maxWidth: "300px", width: "100%" }}>
                            <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                <h3>{product.nameProd}</h3>
                                <p>Цена: {product.price} $</p>
                                <div style={{ height: "200px", display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                                    <img
                                        src={
                                            product.images && product.images.length > 0 
                                                ? `${process.env.REACT_APP_API_URL}${product.images[0]}`
                                                : noPhoto
                                        }
                                        alt={product.nameProd}
                                        style={{ 
                                            maxWidth: "100%", 
                                            maxHeight: "100%", 
                                            objectFit: "contain" 
                                        }}
                                    />
                                </div>
                                <div>{product.isHit ? 'Хит' : ''}</div>
                                <div>{product.isNew ? 'Новинка' : ''}</div>
                                <div>{product.isSale ? 'Акция' : ''}</div>
                                <p>На складе: {product.stock}</p>
                                {/* Отображаем размеры, если они есть */}
                                {product.sizes && product.sizes.length > 0 && (
                                <div style={{ marginBottom: "10px" }}>
                                    <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Размеры:</p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                        {product.sizes.map((size, index) => (
                                            <span 
                                                key={index} 
                                                style={{
                                                    padding: "3px 8px",
                                                    background: "#f0f0f0",
                                                    borderRadius: "4px",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Отображаем цвета, если они есть */}
                            {product.colors && product.colors.length > 0 && (
                                <div style={{ marginBottom: "10px" }}>
                                    <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Цвета:</p>
                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                        {product.colors.map((color, index) => (
                                            <div 
                                                key={index}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "50%",
                                                    background: color,
                                                    border: "1px solid #ddd"
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            </Link>
                            <Link className='prod__brand' to={`/brand/${product.brand}`}>{product.brand}</Link>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button onClick={() => handleDecrease(product.id)}>-</button>
                                <input
                                type="text"
                                value={quantities[product.id] || 1}
                                onChange={(e) => handleQuantityChange(e, product.id, product.stock)}
                                style={{ width: 50 }}
                                />

                                <button onClick={() => handleIncrease(product.id, product.stock)}>+</button>
                            </div>

                            <button onClick={() => toggleFavorite(product.id)}>
                                {favoriteIds.includes(product.id) ? "★ В избранном" : "☆ В избранное"}
                            </button>

                            <button onClick={() => handleAddToCart(product.id, product.stock)}>Добавить в корзину</button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        </>
    );
};

export default CategoryPage;