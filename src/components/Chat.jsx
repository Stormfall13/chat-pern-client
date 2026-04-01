import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './chatstyles.css';

const Chat = () => {
    // Получаем пользователя из Redux
    const user = useSelector((state) => state.auth.user);
    const token = useSelector((state) => state.auth.token);
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const messagesEndRef = useRef(null);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Загрузка сообщений
    const loadMessages = useCallback(async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/chat/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Не удалось загрузить сообщения');
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    // Отправка сообщения
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !token) return;
        
        setSending(true);
        try {
            const payload = {
                message: newMessage.trim(),
                ...(replyTo && { replyToId: replyTo.id })
            };

            const response = await axios.post(`${API_URL}/api/chat/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setReplyTo(null);
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.response?.data?.message || 'Не удалось отправить сообщение');
        } finally {
            setSending(false);
        }
    };

    // Редактирование сообщения
    const editMessage = async (messageId, newText) => {
        try {
            const response = await axios.put(`${API_URL}/api/chat/messages/${messageId}`, 
                { message: newText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? response.data : msg
            ));
            setEditingMessage(null);
        } catch (err) {
            console.error('Error editing message:', err);
            setError('Не удалось редактировать сообщение');
        }
    };

    // Удаление сообщения
    const deleteMessage = async (messageId) => {
        if (!window.confirm('Удалить сообщение?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/chat/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, isDeleted: true } : msg
            ));
        } catch (err) {
            console.error('Error deleting message:', err);
            setError('Не удалось удалить сообщение');
        }
    };

    // Проверка, что пользователь является автором сообщения
    const isAuthor = (messageUserId) => {
        return user && user.id === messageUserId;
    };

    // Проверка, является ли пользователь админом
    const isAdmin = () => {
        return user && user.role === 'admin';
    };

    // Автоматическая загрузка сообщений при монтировании и наличии токена
    useEffect(() => {
        if (token) {
            loadMessages();
            // Обновление каждые 5 секунд
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [loadMessages, token]);

    // Скролл к новым сообщениям
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Если пользователь не авторизован
    if (!user || !token) {
        return (
            <div className="chat-container">
                <div className="chat-header">
                    <h2>Общий чат</h2>
                </div>
                <div className="messages-container">
                    <div className="loading-messages">
                        Пожалуйста, войдите в систему для доступа к чату
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Общий чат</h2>
                <div className="user-info">
                    Вы вошли как: <strong>{user.username}</strong> 
                    {user.role === 'admin' && <span className="admin-badge"> (Администратор)</span>}
                </div>
            </div>
            
            {error && (
                <div className="chat-error">
                    {error}
                    <button onClick={loadMessages}>Повторить</button>
                </div>
            )}
            
            <div className="messages-container">
                {loading && messages.length === 0 ? (
                    <div className="loading-messages">Загрузка сообщений...</div>
                ) : (
                    <>
                        {messages.length === 0 && !loading && (
                            <div className="no-messages">
                                Пока нет сообщений. Будьте первым!
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`message ${msg.isDeleted ? 'deleted' : ''}`}
                            >
                                <div className="message-header">
                                    <span className="username" style={{ 
                                        color: msg.user?.role === 'admin' ? '#ff4757' : '#2c3e50' 
                                    }}>
                                        {msg.username}
                                        {msg.user?.role === 'admin' && <span className="admin-tag"> (admin)</span>}
                                    </span>
                                    <span className="timestamp">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                    {msg.isEdited && <span className="edited">(ред.)</span>}
                                </div>
                                
                                {msg.replyTo && !msg.replyTo.isDeleted && (
                                    <div className="reply-to">
                                        <span>Ответ на сообщение от {msg.replyTo.user?.username}:</span>
                                        <div className="reply-text">
                                            {msg.replyTo.message.substring(0, 100)}
                                            {msg.replyTo.message.length > 100 && '...'}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="message-content">
                                    {editingMessage === msg.id ? (
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const input = e.target.querySelector('input');
                                            if (input.value.trim()) {
                                                editMessage(msg.id, input.value);
                                            }
                                        }}>
                                            <input 
                                                type="text" 
                                                defaultValue={msg.message}
                                                autoFocus
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        editMessage(msg.id, e.target.value);
                                                    } else {
                                                        setEditingMessage(null);
                                                    }
                                                }}
                                            />
                                        </form>
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                </div>
                                
                                {!msg.isDeleted && (
                                    <div className="message-actions">
                                        <button onClick={() => setReplyTo(msg)} className="reply-btn">
                                            📝 Ответить
                                        </button>
                                        {(isAuthor(msg.userId) || isAdmin()) && (
                                            <>
                                                <button onClick={() => setEditingMessage(msg.id)} className="edit-btn">
                                                    ✏️ Редактировать
                                                </button>
                                                <button onClick={() => deleteMessage(msg.id)} className="delete-btn">
                                                    🗑️ Удалить
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            
            {replyTo && (
                <div className="reply-indicator">
                    <span>Ответ на: {replyTo.username}</span>
                    <button onClick={() => setReplyTo(null)}>✖</button>
                </div>
            )}
            
            <form onSubmit={sendMessage} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    disabled={sending}
                    maxLength={1000}
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? 'Отправка...' : 'Отправить'}
                </button>
            </form>
        </div>
    );
};

export default Chat;