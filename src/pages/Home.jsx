import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchFavorites } from "../store/slices/favoriteSlice";

const Home = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(fetchFavorites());
        }
    }, [dispatch]);

    return (
        <>
            Главная
        </>
    );
};

export default Home;
