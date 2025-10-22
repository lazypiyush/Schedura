import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef } from 'react'
import './TaskCard.css'

const TaskCard = ({ task, isDragging, onMoveTask, isFocused, setFocused, clearFocus, onTaskClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task._id
  })

  const cardRef = useRef(null)
  const isClickingButton = useRef(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const priorityColors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#FF5722',
    urgent: '#F44336'
  }

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus()
    }
  }, [isFocused])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      
      const direction = e.key === 'ArrowLeft' ? 'prev' : 'next'
      if (onMoveTask) {
        onMoveTask(task._id, task.status, direction)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (onTaskClick) {
        onTaskClick(task)
      }
    }
  }

  const handleArrowClick = (direction, e) => {
    e.preventDefault()
    e.stopPropagation()
    isClickingButton.current = true
    
    if (onMoveTask) {
      onMoveTask(task._id, task.status, direction)
    }
    
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.focus()
      }
      isClickingButton.current = false
    }, 100)
  }

  const handleBlur = (e) => {
    if (!isClickingButton.current) {
      clearFocus()
    }
  }

  const handleCardClick = (e) => {
    // Don't open modal if clicking arrow buttons
    if (e.target.closest('.task-arrow-btn')) return
    if (onTaskClick) {
      onTaskClick(task)
    }
  }

  const combinedRef = (element) => {
    setNodeRef(element)
    cardRef.current = element
  }

  return (
    <div
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isFocused ? 'task-card-focused' : ''}`}
      tabIndex={0}
      onFocus={setFocused}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
    >
      <div className="task-header">
        <h4>{task.title}</h4>
        <span 
          className="priority-badge" 
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-footer">
        <div className="task-footer-left">
          {task.dueDate && (
            <span className="due-date">
              📅 {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.assignee && (
            <span className="assignee">
              👤 {task.assignee.name}
            </span>
          )}
        </div>
        {task.commentCount > 0 && (
          <span className="comment-count">
            💬 {task.commentCount}
          </span>
        )}
      </div>
      
      {isFocused && (
        <div className="task-controls">
          <button 
            className="task-arrow-btn task-arrow-left"
            onClick={(e) => handleArrowClick('prev', e)}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Move to previous column (←)"
            type="button"
          >
            ←
          </button>
          <button 
            className="task-arrow-btn task-arrow-right"
            onClick={(e) => handleArrowClick('next', e)}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Move to next column (→)"
            type="button"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskCard
