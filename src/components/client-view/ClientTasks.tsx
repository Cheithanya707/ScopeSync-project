import { ListTodo } from "lucide-react";
import type { ClientTask } from "@/services/client-view/clientShareData";
import { ClientCard, ClientEmpty, clientDateLabel, clientHumanize } from "@/components/client-view/ClientViewPrimitives";

export function ClientTasks({ tasks }: { tasks: ClientTask[] }) {
  return <ClientCard title="Project tasks" icon={ListTodo}>{tasks.length === 0 ? <ClientEmpty>No tasks are available to share yet.</ClientEmpty> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-4 font-medium">Task</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-4 font-medium">Priority</th><th className="py-3 font-medium">Due date</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} className="border-b border-border last:border-0"><th scope="row" className="py-3 pr-4 font-medium text-slate-900">{task.title}</th><td className="py-3 pr-4 capitalize text-slate-700">{clientHumanize(task.status)}</td><td className="py-3 pr-4 capitalize text-slate-700">{task.priority}</td><td className="py-3 text-slate-700">{clientDateLabel(task.dueDate)}</td></tr>)}</tbody></table></div>}</ClientCard>;
}
