import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchComments, addComment, clearError, clearSuccess } from "../../store/slices/commentsSlice";

import starTrue from '../../assets/star-true.svg';
import starFalse from '../../assets/star-false.svg';

const CommentsProdPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const { items: comments, loading, error: commentError, success: commentSuccess } = useSelector((state) => state.comments);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0); // Новое состояние для рейтинга
  const [hoverRating, setHoverRating] = useState(0); // Для hover эффекта

  useEffect(() => {
    dispatch(fetchComments(id));
  }, [id, dispatch]);

  // 🔹 ВЫЧИСЛЯЕМ СРЕДНИЙ РЕЙТИНГ ( только для комментариев с рейтингом )
  const averageRating = comments.length > 0 
  ? (comments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / comments.length).toFixed(1)
  : 0;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(clearSuccess());

    if (!commentText.trim()) {
      dispatch(clearError("Введите текст комментария"));
      return;
    }

    if (!token && (!guestName.trim() || !guestEmail.trim())) {
      dispatch(clearError("Для гостей обязательны имя и email"));
      return;
    }

    dispatch(
      addComment({
        productId: id,
        text: commentText,
        rating,
        guestName,
        guestEmail,
      })
    ).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setCommentText("");
        setGuestName("");
        setGuestEmail("");
        setRating(0);
      }
    });
  };

  // 🔹 КОМПОНЕНТ ЗВЕЗДОЧЕК ДЛЯ РЕЙТИНГА
  const StarRating = ({ currentRating, onRatingChange, editable = true }) => {
    return (
      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <img
            key={star}
            src={star <= currentRating ? starTrue : starFalse}
            alt={star <= currentRating ? "Filled star" : "Empty star"}
            style={{ 
              cursor: editable ? "pointer" : "default",
              width: "24px",
              height: "24px"
            }}
            onClick={() => editable && onRatingChange(star)}
            onMouseEnter={() => editable && setHoverRating(star)}
            onMouseLeave={() => editable && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 🔹 СРЕДНИЙ РЕЙТИНГ ТОВАРА */}
      <div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h3>Рейтинг товара</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StarRating currentRating={Math.round(averageRating)} editable={false} />
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>{averageRating}</span>
          <span style={{ color: "#666" }}>({comments.length} отзывов)</span>
        </div>
      </div>
      {/* 🔹 ФОРМА КОММЕНТАРИЯ */}
      <div className="comments__modules">
        <h3>User comments</h3>
        {commentSuccess && <p style={{ color: "green" }}>{commentSuccess}</p>}
        {commentError && <p style={{ color: "red" }}>{commentError}</p>}
        {/* Выбор рейтинга */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Ваша оценка:
          </label>
          <StarRating 
            currentRating={hoverRating || rating} 
            onRatingChange={setRating}
            editable={true}
          />
          {rating > 0 && <span style={{ marginLeft: "10px" }}>{rating} звезд(ы)</span>}
        </div>
        <form onSubmit={handleCommentSubmit}>
          {/* Поля для гостей */}
          {!token && (
            <>
              <input
                type="text"
                placeholder="Ваше имя"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  width: "100%",
                  maxWidth: "300px",
                }}
              />
              <input
                type="email"
                placeholder="Ваш email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  width: "100%",
                  maxWidth: "300px",
                }}
              />
            </>
          )}
          <textarea
            placeholder="Ваш отзыв..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "8px",
              marginBottom: "10px",
            }}
          />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>

      {/* 🔹 СПИСОК КОММЕНТАРИЕВ С РЕЙТИНГОМ */}
      <div style={{ marginTop: "40px" }}>
        <h3>Отзывы ({comments.length})</h3>
        {loading ? (
          <p>Загрузка комментариев...</p>
        ) : comments.length === 0 ? (
          <p>Пока нет отзывов.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "5px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>
                    {user.username}
                  </strong>
                  <span
                    style={{ color: "gray", fontSize: "0.9em", marginLeft: "10px" }}
                  >
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Рейтинг в комментарии */}
                <div className="rating__wrapp">
                  {comment.rating && comment.rating > 0 ? (
                    <StarRating currentRating={comment.rating} editable={false} />
                  ) : (
                    <span style={{ color: "#999", fontStyle: "italic" }}>Без оценки</span>
                  )}
                </div>
              </div>
              
              <p style={{ marginTop: "10px" }}>{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default CommentsProdPage;
