"use client";

import { cn } from "../lib/utils";
import {
    closestCorners,
    defaultDropAnimationSideEffects,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    DropAnimation,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Clock,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { triggerHaptic } from "../lib/utils";

// Drag motion: the iOS sheet curve for gliding home, and the lifted pose it settles from
const SETTLE = "cubic-bezier(0.32, 0.72, 0, 1)";
const LIFT = "scale(1.04) rotate(1.5deg)";

// --- Inline UI Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "secondary" | "destructive", size?: "default" | "sm" | "lg" | "icon" }>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground shadow hover:bg-primary/90": variant === "default",
                        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground": variant === "outline",
                        "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
                        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80": variant === "secondary",
                        "bg-red-500 text-white shadow-sm hover:bg-red-600": variant === "destructive",
                        "h-9 px-4 py-2": size === "default",
                        "h-8 rounded-md px-3 text-xs": size === "sm",
                        "h-10 rounded-md px-8": size === "lg",
                        "h-9 w-9": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

const Badge = ({ className, variant = "default", onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" }) => {
    return (
        <div className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            {
                "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80": variant === "default",
                "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
                "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80": variant === "destructive",
                "text-foreground": variant === "outline",
            },
            className
        )} onClick={onClick} {...props} />
    )
}

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                className
            )}
            {...props}
        />
    )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
    ({ className, ...props }, ref) => (
        <img
            ref={ref}
            className={cn("aspect-square h-full w-full object-cover", className)}
            {...props}
        />
    )
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
)
AvatarFallback.displayName = "AvatarFallback"


// --- Style tokens (match the rest of the site) ---

// 16px on touch so iOS never zooms into the field
const FIELD = "w-full h-10 rounded-[12px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] px-3.5 text-[16px] sm:text-[14px] text-neutral-50 placeholder:text-[#a1a1a1] outline-none focus:ring-white/25 transition-shadow";
const LABEL = "block text-[12px] text-[#a1a1a1]";
const PRIORITY_DOT = {
    low: "bg-sky-400",
    medium: "bg-amber-400",
    high: "bg-red-400",
} as const;
// Tinted pill: soft fill, matching hairline, readable text
const PRIORITY_PILL = {
    low: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
    medium: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    high: "bg-red-400/10 text-red-300 ring-red-400/20",
} as const;

// --- Types ---

type Id = string | number;

type Column = {
    id: Id;
    title: string;
};

type Task = {
    id: Id;
    columnId: Id;
    content: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    comments: number;
    attachments: number;
    dueDate?: string;
    description?: string; // Added description
    assignees: string[];
};

// --- Mock Data ---

const initialColumns: Column[] = [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
];

const initialTasks: Task[] = [
    {
        id: "1",
        columnId: "todo",
        content: "Design new landing page",
        priority: "high",
        tags: ["Design", "Marketing"],
        comments: 3,
        attachments: 2,
        dueDate: "Tomorrow",
        description: "Create high-fidelity mockups for the new landing page including hero section and features.",
        assignees: ["https://github.com/shadcn.png", "https://github.com/shadcn.png"],
    },
    {
        id: "2",
        columnId: "todo",
        content: "Competitor analysis",
        priority: "medium",
        tags: ["Research"],
        comments: 1,
        attachments: 0,
        dueDate: "Next Week",
        description: "Analyze top 5 competitors and identify gaps in the market.",
        assignees: ["https://github.com/shadcn.png"],
    },
];

// --- Components ---

// Mounted only while open (see parent), so its hooks always run and its fields
// start from the task being edited every time.
function TaskModal({
    onClose,
    onSave,
    task,
    columnId,
    onDelete
}: {
    onClose: () => void,
    onSave: (task: Partial<Task>) => void,
    task?: Task | null,
    columnId?: Id,
    onDelete?: (id: Id) => void
}) {
    const [content, setContent] = useState(task?.content || "");
    const [description, setDescription] = useState(task?.description || "");
    const [priority, setPriority] = useState<"low" | "medium" | "high">(task?.priority || "medium");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(task?.tags || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            content,
            description,
            priority,
            tags,
            columnId: task?.columnId || columnId || "todo",
        });
        onClose();
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        // Bottom sheet on phones, centred dialog from sm up
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={task ? "Edit task" : "New task"}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-[420px] max-h-[90dvh] overflow-y-auto overscroll-contain bg-[#141414] rounded-t-[22px] sm:rounded-[22px] ring-1 ring-white/[0.08] shadow-2xl pb-[env(safe-area-inset-bottom)] font-sans"
            >
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <h2 className="text-[17px] leading-[24px] font-semibold text-neutral-50">
                        {task ? "Edit task" : "New task"}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-[#a1a1a1] hover:text-white hover:bg-white/[0.06] transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 space-y-4">
                    <label className="block space-y-1.5">
                        <span className={LABEL}>Title</span>
                        <input value={content} onChange={e => setContent(e.target.value)} placeholder="What needs doing?" required className={FIELD} />
                    </label>

                    <label className="block space-y-1.5">
                        <span className={LABEL}>Description</span>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details" rows={3} className={cn(FIELD, "h-auto py-2.5 resize-none")} />
                    </label>

                    <div className="space-y-1.5">
                        <span className={LABEL}>Priority</span>
                        {/* Segmented control instead of a select: one tap, always visible */}
                        <div role="radiogroup" aria-label="Priority" className="grid grid-cols-3 p-0.5 rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
                            {(["low", "medium", "high"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    role="radio"
                                    aria-checked={priority === p}
                                    onClick={() => setPriority(p)}
                                    className={cn(
                                        "h-8 rounded-full text-[13px] capitalize inline-flex items-center justify-center gap-1.5 transition-colors",
                                        priority === p ? "bg-white/[0.12] text-neutral-50" : "text-[#a1a1a1] hover:text-white"
                                    )}
                                >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[p])} />
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="block space-y-1.5">
                        <span className={LABEL}>Tags</span>
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} enterKeyHint="done" placeholder="Type and press Enter" className={FIELD} />
                    </label>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map(tag => (
                                <button key={tag} type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="h-7 px-2.5 rounded-full bg-white/[0.06] text-[12px] text-[#a1a1a1] hover:text-white hover:bg-white/[0.1] transition-colors">
                                    {tag} <span aria-hidden className="text-[#a1a1a1]">×</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        {task && onDelete && (
                            <button type="button" aria-label="Delete task" onClick={() => { onDelete(task.id); onClose(); }} className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-white/[0.06] text-[#a1a1a1] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button type="submit" className="flex-1 h-10 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 transition-colors">
                            {task ? "Save changes" : "Create task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function KanbanBoard({ onNavigate }: { onNavigate?: (view: string) => void }) {
    // --- State & Persistence ---
    const [columns, setColumns] = useState<Column[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("kanban-columns");
            if (saved) return JSON.parse(saved);
        }
        return initialColumns;
    });

    const [tasks, setTasks] = useState<Task[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("kanban-tasks");
            if (saved) return JSON.parse(saved);
        }
        return initialTasks;
    });

    useEffect(() => {
        localStorage.setItem("kanban-columns", JSON.stringify(columns));
    }, [columns]);

    useEffect(() => {
        localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
    }, [tasks]);

    // --- Interaction State ---
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [targetColumnId, setTargetColumnId] = useState<Id>("todo");

    // Set page title, and hand the previous one back on the way out
    useEffect(() => {
        const previous = document.title;
        document.title = "Kanban | Syed Subhan";
        return () => {
            document.title = previous;
        };
    }, []);

    const sensors = useSensors(
        // Mouse: drag after 3px of movement
        useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
        // Touch: press and hold briefly, so a normal swipe still scrolls the board
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        return tasks.filter((task) =>
            task.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tasks, searchQuery]);

    // --- Actions ---

    const handleCreateTask = (taskData: Partial<Task>) => {
        const newTask: Task = {
            id: Date.now().toString(),
            columnId: taskData.columnId || "todo",
            content: taskData.content || "New Task",
            priority: taskData.priority || "medium",
            tags: taskData.tags || [],
            comments: 0,
            attachments: 0,
            description: taskData.description || "",
            assignees: [],
            ...taskData
        };
        setTasks([...tasks, newTask]);
    };

    const handleUpdateTask = (taskData: Partial<Task>) => {
        if (!editingTask) return;
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    };

    const handleDeleteTask = (id: Id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const openForCreate = (columnId: Id = "todo") => {
        setEditingTask(null);
        setTargetColumnId(columnId);
        setIsModalOpen(true);
    };

    const openForEdit = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // --- DnD Handlers ---

    function onDragStart(event: DragStartEvent) {
        triggerHaptic(8); // the pick-up tick
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";

        if (!isActiveTask) return;

        // Im dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);

                if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
                    tasks[activeIndex].columnId = tasks[overIndex].columnId;
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        const isOverColumn = over.data.current?.type === "Column";

        // Im dropping a Task over a column
        if (isActiveTask && isOverColumn) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);

                tasks[activeIndex].columnId = overId;
                return arrayMove(tasks, activeIndex, activeIndex);
            });
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;
        triggerHaptic([4, 24, 6]); // a softer double tap as it lands

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === "Column";
        if (isActiveColumn) {
            setColumns((columns) => {
                const activeIndex = columns.findIndex((col) => col.id === activeId);
                const overIndex = columns.findIndex((col) => col.id === overId);
                return arrayMove(columns, activeIndex, overIndex);
            });
        }
    }

    // Drop: glide home on the iOS sheet curve while the lifted card settles flat again
    const dropAnimation: DropAnimation = {
        duration: 280,
        easing: SETTLE,
        sideEffects: (args) => {
            const cleanup = defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } })(args);
            const lifted = args.dragOverlay.node.firstElementChild as HTMLElement | null;
            lifted?.animate(
                [{ transform: LIFT }, { transform: 'none' }],
                { duration: 280, easing: SETTLE, fill: 'forwards' }
            );
            return cleanup;
        },
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full max-w-[1280px] mx-auto flex-col gap-5 overflow-x-clip bg-black text-neutral-50 font-sans px-4 sm:px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* Modal */}
            {isModalOpen && (
                <TaskModal
                    key={editingTask?.id ?? `new-${targetColumnId}`}
                    onClose={() => setIsModalOpen(false)}
                    onSave={editingTask ? handleUpdateTask : handleCreateTask}
                    task={editingTask}
                    columnId={targetColumnId}
                    onDelete={handleDeleteTask}
                />
            )}

            {/* Back pill — same as every inner page */}
            {onNavigate && (
                <div className="h-14 flex items-center">
                    <button
                        type="button"
                        onClick={() => onNavigate('home')}
                        className="inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-full bg-[#1c1c1c] text-[14px] text-[#a1a1a1] hover:text-white hover:bg-[#242424] transition-colors"
                    >
                        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m12.5 4.75-5 5.25 5 5.25" />
                        </svg>
                        Syed Subhan
                    </button>
                </div>
            )}

            {/* Header: title on the left, search + new task on the right. No box. */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pt-4 pb-2">
                <div className="min-w-0">
                    <h1 className="font-sans text-[28px] leading-[34px] md:text-[32px] md:leading-[40px] font-bold text-neutral-50">
                        Kanban
                    </h1>
                    <p className="mt-1 text-[14px] leading-[22px] text-[#a1a1a1]">
                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across {columns.length} columns. Drag to reorder.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none min-w-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1a1] pointer-events-none" />
                        <input
                            type="search"
                            enterKeyHint="search"
                            aria-label="Search tasks"
                            placeholder="Search"
                            className="w-full md:w-[220px] h-10 rounded-full bg-[#171717] ring-1 ring-inset ring-white/[0.06] pl-10 pr-4 text-[16px] sm:text-[14px] text-neutral-50 placeholder:text-[#a1a1a1] outline-none focus:ring-white/20 transition-shadow"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => openForCreate()}
                        aria-label="New task"
                        className="h-10 shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New task</span>
                    </button>
                </div>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                {/* Phones/tablets: swipe column by column. Wide screens: all four columns fit. */}
                <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain scroll-px-4 -mx-4 px-4 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0 xl:overflow-visible pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <SortableContext
                        items={columnsId}
                        strategy={horizontalListSortingStrategy}
                    >
                        {columns.map((col) => (
                            <BoardColumn
                                key={col.id}
                                column={col}
                                tasks={filteredTasks.filter((task) => task.columnId === col.id)}
                                onAddTask={() => openForCreate(col.id)}
                                onEditTask={openForEdit}
                            />
                        ))}
                    </SortableContext>
                </div>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeColumn && (
                        <BoardColumn
                            column={activeColumn}
                            tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
                            isOverlay
                        />
                    )}
                    {/* Picked up: the card lifts toward you with a little spring and tilt */}
                    {activeTask && (
                        <motion.div
                            initial={{ scale: 1, rotate: 0 }}
                            animate={{ scale: 1.04, rotate: 1.5 }}
                            transition={{ type: 'spring', duration: 0.35, bounce: 0.3 }}
                            className="rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
                        >
                            <TaskCard task={activeTask} isOverlay />
                        </motion.div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

interface BoardColumnProps {
    column: Column;
    tasks: Task[];
    isOverlay?: boolean;
    onAddTask?: () => void;
    onEditTask?: (task: Task) => void;
}

function BoardColumn({ column, tasks, isOverlay, onAddTask, onEditTask }: BoardColumnProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const tasksIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                // A quiet lane: barely-there fill, no border, no shadow
                "relative flex flex-col rounded-[22px] bg-white/[0.025] p-2",
                // 85% of the screen on phones (next column peeks in), fixed on tablets, flexible on desktop
                "w-[85vw] max-w-[320px] shrink-0 snap-center sm:w-[290px] xl:w-auto xl:max-w-none xl:flex-1 xl:min-w-0 xl:[scroll-snap-align:none]",
                isDragging && "bg-transparent outline-dashed outline-1 -outline-offset-1 outline-white/[0.1] [&>*]:invisible",
                isOverlay && "ring-1 ring-white/10 bg-[#111] shadow-2xl cursor-grabbing"
            )}
        >
            {/* Column header doubles as the drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between px-3 pt-2 pb-3 cursor-grab active:cursor-grabbing touch-manipulation"
            >
                <div className="flex items-baseline gap-2">
                    <h3 className="font-sans text-[14px] font-medium text-neutral-50">{column.title}</h3>
                    <span className="text-[12px] text-[#a1a1a1] tabular-nums">{tasks.length}</span>
                </div>
                <button
                    type="button"
                    onClick={onAddTask}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={`Add task to ${column.title}`}
                    className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-[#a1a1a1] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 min-h-[88px]">
                <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={() => onEditTask?.(task)} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <button
                        type="button"
                        onClick={onAddTask}
                        className="flex-1 min-h-[88px] rounded-[16px] border border-dashed border-white/[0.08] text-[12px] text-[#a1a1a1] hover:text-neutral-50 hover:border-white/15 transition-colors"
                    >
                        Drop a task here
                    </button>
                )}
            </div>
        </div>
    );
}

interface TaskCardProps {
    task: Task;
    isOverlay?: boolean;
    onClick?: () => void;
}

function TaskCard({ task, isOverlay, onClick }: TaskCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
        // Neighbours make room on the same curve the drop uses
        transition: { duration: 260, easing: SETTLE },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                // Same surface as every card on the site
                "group relative flex flex-col gap-2 cursor-grab rounded-[16px] bg-[#171717] ring-1 ring-inset ring-white/[0.05] p-4 transition-[background-color,scale] duration-150 ease-out hover:bg-[#1c1c1c] active:scale-[0.985] active:cursor-grabbing touch-manipulation select-none",
                // Where the card came from: an empty slot the same size, not a faded copy
                isDragging && "bg-transparent ring-0 outline-dashed outline-1 -outline-offset-1 outline-white/[0.12] [&>*]:invisible",
                isOverlay && "cursor-grabbing bg-[#1e1e1e] ring-white/15"
            )}
        >
            {/* Priority and tags as rounded pills */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-medium capitalize ring-1 ring-inset", PRIORITY_PILL[task.priority])}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
                    {task.priority}
                </span>
                {task.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center h-[22px] px-2 rounded-full bg-white/[0.06] text-[11px] font-medium text-[#a1a1a1]">
                        {tag}
                    </span>
                ))}
            </div>

            <p className="text-[14px] leading-[20px] font-medium text-neutral-50">
                {task.content}
            </p>

            {task.description && (
                <p className="text-[12px] leading-[18px] text-[#a1a1a1] line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[12px] text-[#a1a1a1]">
                    {task.dueDate && (
                        <div className={cn("flex items-center gap-1", task.priority === "high" && "text-red-400/80")}>
                            <Clock className="h-3 w-3" />
                            <span>{task.dueDate}</span>
                        </div>
                    )}
                    {(task.comments > 0 || task.attachments > 0) && (
                        <div className="flex items-center gap-2">
                            {task.comments > 0 && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{task.comments}</span>
                                </div>
                            )}
                            {task.attachments > 0 && (
                                <div className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task.attachments}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Assignees */}
                {task.assignees.length > 0 && (
                    <div className="flex -space-x-2">
                        {task.assignees.map((avatar, i) => (
                            <Avatar key={i} className="h-5 w-5 ring-2 ring-[#171717]">
                                <AvatarImage src={avatar} alt="" />
                                <AvatarFallback className="text-[8px] bg-white/10 text-[#a1a1a1]">
                                    U{i + 1}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
