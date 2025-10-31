import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { commentsAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import './TaskModal.css'

const TaskModal = ({ task, onClose, onSubmit }) => {
  const { user } = useUser()
  const socket = useSocket()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  })

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  // Pre-fill form
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      })
    }
  }, [task])

  // Fetch comments on mount and set up polling
  useEffect(() => {
    if (!task?._id) return

    fetchComments()

    // Poll every 5 seconds
    const interval = setInterval(fetchComments, 5000)

    return () => clearInterval(interval)
  }, [task?._id])

  // Socket.IO listener (bonus - instant updates when socket works)
  useEffect(() => {
    if (!socket || !task?._id) return

    const handleCommentAdded = (data) => {
      console.log('💬 Socket comment update:', data)
      if (data.taskId === task._id) {
        fetchComments()
      }
    }

    socket.on('comment-added', handleCommentAdded)

    return () => {
      socket.off('comment-added', handleCommentAdded)
    }
  }, [socket, task?._id])

  const fetchComments = async () => {
    if (!task?._id) return
    
    try {
      const response = await commentsAPI.getByTask(task._id)
      setComments(response.data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?._id) return

    try {
      await commentsAPI.create({
        taskId: task._id,
        text: newComment.trim()
      })
      
      setNewComment('')
      
      // Emit socket event
      if (socket) {
        socket.emit('new-comment', {
          taskId: task._id,
          projectId: task.project
        })
      }
      
      // Immediate update
      await fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await commentsAPI.delete(commentId)
      
      if (socket) {
        socket.emit('new-comment', {
          taskId: task._id,
          projectId: task.project,
          action: 'delete'
        })
      }
      
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>

        {/* Comments Section */}
        {task?._id && (
          <div className="task-comments-section">
            <div className="comments-divider"></div>
            
            <div className="comments-header">
              <h3>💬 Comments ({comments.length})</h3>
              <span className="auto-refresh-indicator">
                🔄 Auto-refreshing every 5s
              </span>
            </div>

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-author">
                        <img 
                          src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name || 'User'}&background=2196F3&color=fff`} 
                          alt={comment.user?.name}
                          className="comment-avatar"
                        />
                        <div>
                          <strong>{comment.user?.name || 'Unknown User'}</strong>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {comment.user?._id === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="btn-delete-comment"
                          type="button"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="comment-input"
                rows="3"
              />
              <button 
                onClick={handleAddComment}
                className="btn-add-comment"
                type="button"
                disabled={!newComment.trim()}
              >
                💬 Add Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskModal
