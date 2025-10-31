import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { commentsAPI } from '../services/api'
import { useUser } from '@clerk/clerk-react'
import './TaskDetailModal.css'

const TaskDetailModal = ({ task, projectId, onClose, onUpdate }) => {
  const [comments, setComments] = useState([])
  const [displayedComments, setDisplayedComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [displayCount, setDisplayCount] = useState(10) // Show 10 initially
  const [hasMore, setHasMore] = useState(false)
  const socket = useSocket()
  const { user } = useUser()

  const COMMENTS_PER_PAGE = 10

  useEffect(() => {
    fetchComments()
    
    if (socket) {
      socket.on('comment-added', (data) => {
        if (data.taskId === task._id) {
          console.log('💬 Real-time comment received:', data.comment)
          setComments(prev => {
            const exists = prev.some(c => c._id === data.comment._id)
            if (exists) return prev
            return [data.comment, ...prev]
          })
        }
      })

      socket.on('comment-deleted', (data) => {
        if (data.taskId === task._id) {
          console.log('🗑️ Comment deleted:', data.commentId)
          setComments(prev => prev.filter(c => c._id !== data.commentId))
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('comment-added')
        socket.off('comment-deleted')
      }
    }
  }, [socket, task._id])

  // Update displayed comments when comments or displayCount changes
  useEffect(() => {
    const displayed = comments.slice(0, displayCount)
    setDisplayedComments(displayed)
    setHasMore(comments.length > displayCount)
  }, [comments, displayCount])

  const fetchComments = async () => {
    try {
      setRefreshing(true)
      const res = await commentsAPI.getByTask(task._id)
      setComments(res.data)
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + COMMENTS_PER_PAGE)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const res = await commentsAPI.create({
        content: newComment,
        task: task._id
      })
      
      setComments(prev => {
        const exists = prev.some(c => c._id === res.data._id)
        if (exists) return prev
        return [res.data, ...prev]
      })
      
      setNewComment('')
      
      if (socket) {
        socket.emit('new-comment', {
          taskId: task._id,
          projectId,
          comment: res.data
        })
      }
      
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Error adding comment:', err)
      fetchComments()
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    
    try {
      await commentsAPI.delete(commentId)
      
      setComments(comments.filter(c => c._id !== commentId))
      
      if (socket) {
        socket.emit('comment-deleted', { 
          taskId: task._id, 
          commentId,
          projectId 
        })
      }
      
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Error deleting comment:', err)
      fetchComments()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💬 {task.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {task.description && (
            <div className="task-section">
              <h3>Description</h3>
              <p>{task.description}</p>
            </div>
          )}

          <div className="task-section">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3>
                Comments ({comments.length})
                {displayedComments.length < comments.length && (
                  <span style={{ fontSize: '13px', color: '#999', marginLeft: '8px' }}>
                    Showing {displayedComments.length} of {comments.length}
                  </span>
                )}
              </h3>
              <button
                onClick={fetchComments}
                disabled={refreshing}
                style={{
                  padding: '6px 14px',
                  background: refreshing ? '#999' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {refreshing ? '⟳' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
              />
              <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                Post Comment
              </button>
            </form>

            <div className="comments-list">
              {loading ? (
                <p>Loading comments...</p>
              ) : displayedComments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                <>
                  {displayedComments.map(comment => (
                    <div key={comment._id} className="comment">
                      <div className="comment-header">
                        <div className="comment-author">
                          {comment.createdBy?.avatar ? (
                            <img 
                              src={comment.createdBy.avatar} 
                              alt={comment.createdBy.name}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar">
                              {comment.createdBy?.name?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <strong>{comment.createdBy?.name || 'Unknown User'}</strong>
                            <span className="comment-time">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {comment.createdBy?._id === user?.id && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '16px',
                        background: 'transparent',
                        border: '2px dashed #2196F3',
                        borderRadius: '8px',
                        color: '#2196F3',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(33, 150, 243, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent'
                      }}
                    >
                      ⬇️ Load More Comments ({comments.length - displayedComments.length} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
