import React, { useState, useEffect }  from 'react';
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import BasketCount from "../components/BasketCount";
import GlobalSearchProduct from '../components/GlobalSearchProduct'



const HeaderMain = () => {

    const [categories, setCategories] = useState([]);
    const [openCollection, setOpenCollection] = useState(null);
    const [userWindow, setUserWindow] = useState(false);
    const favoriteIds = useSelector((state) => state.favorites.ids);
    const user = useSelector((state) => state.auth.user);
    

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/categories`)
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Ошибка загрузки категорий", err));
    }, []);

    const handleToggle = (collectionName) => {
        setOpenCollection(prev => prev === collectionName ? null : collectionName);
    };

    return (
        <header className="header">
            <div className="header__wrapp" style={{ display: 'flex', alignItems: 'center' }}>
                <a href="/" className="logo">
                    {/* <img src="" alt="logo" /> */}
                    LOGO
                </a>
                <nav className="category__menu">
                <ul className="title__category">
                    <Link className="shop__link" to='/allcategory'>Shop</Link>
                    {Object.entries(
                        categories.reduce((acc, category) => {
                        if (!acc[category.collection]) acc[category.collection] = [];
                        acc[category.collection].push(category);
                        return acc;
                        }, {})
                        ).map(([collectionName, collectionCategories]) => (
                        <li key={collectionName}>
                            <span onClick={() => handleToggle(collectionName)}>
                                {collectionName}
                            </span>
                        {openCollection === collectionName && (
                        <ul className="category__list">
                            {collectionCategories.map(category => (
                            <li key={category.id}>
                                <Link to={`/category/${category.id}`}>
                                {category.name}
                                </Link>
                            </li>
                            ))}
                        </ul>
                        )}
                        </li>
                    ))}
                    </ul>
                </nav>
                <GlobalSearchProduct />
                <div className="header__wrapp-btn" style={{ display: 'flex' }}>
                    <div className="user__btn" style={{ background: '#f00', color: '#fff' }}>
                        {user ? (
                            <div 
                                className="user__true"
                                onClick={() => setUserWindow(prev => !prev)}>
                                Авторизован
                            </div>
                        ) : (
                            <div 
                                className="user__false"
                                onClick={() => setUserWindow(prev => !prev)}>
                                Не авторизован
                            </div>
                        )}
                        {userWindow ? (
                            <Header />
                        ) : (
                            ''
                        )}
                    </div>
                    {favoriteIds.length > 0 ? (
                    <div className="favorites__true">
                        <Link to="/favorites">
                            В избранном
                        </Link>
                    </div>
                    ) : (
                    <div className="favorites__false">
                        В избранное
                    </div>
                    )}
                    <BasketCount />
                </div>
            </div>
        </header>
    )
}

export default HeaderMain
