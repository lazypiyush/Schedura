import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import './Column.css'

const Column = ({ column, tasks, onAddTask, onMoveTask, focusedTaskId, setFocusedTaskId, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={`column ${isOver ? 'column-drag-over' : ''}`}>
      <div className="column-header" style={{ borderLeft: `4px solid ${column.color}` }}>
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button className="add-task-btn" onClick={onAddTask}>
          +
        </button>
      </div>

      <div ref={setNodeRef} className="column-content">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onMoveTask={onMoveTask}
              isFocused={task._id === focusedTaskId}
              setFocused={() => setFocusedTaskId(task._id)}
              clearFocus={() => setFocusedTaskId(null)}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="empty-column">
            <p>No tasks yet</p>
            <button onClick={onAddTask}>+ Add task</button>
          </div>
        )}
        
        {tasks.length > 0 && (
          <div className="drop-zone-spacer"></div>
        )}
      </div>
    </div>
  )
}

export default Column
