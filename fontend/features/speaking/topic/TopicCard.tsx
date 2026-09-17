import {
  BriefcaseBusiness,
  BookOpen,
  Plane,
  Utensils,
  ShoppingBag,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TopicCardProps {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

interface TopicStyle {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  hoverBg: string;
}

const topicStyles: Record<string, TopicStyle> = {
  work: {
    icon: BriefcaseBusiness,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#2B4C7E]',
    hoverBg: 'group-hover:bg-blue-100',
  },

  study: {
    icon: BookOpen,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    hoverBg: 'group-hover:bg-sky-100',
  },

  travel: {
    icon: Plane,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    hoverBg: 'group-hover:bg-cyan-100',
  },

  'daily-life': {
    icon: Utensils,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    hoverBg: 'group-hover:bg-emerald-100',
  },

  shopping: {
    icon: ShoppingBag,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    hoverBg: 'group-hover:bg-amber-100',
  },

  conversation: {
    icon: MessageCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#2F80ED]',
    hoverBg: 'group-hover:bg-blue-100',
  },
};

export default function TopicCard({ id, title, description, selected, onClick }: TopicCardProps) {
  const topicStyle = topicStyles[id] ?? topicStyles.conversation;

  const Icon = topicStyle.icon;

  return (
    <button type="button" onClick={onClick} className="group w-full text-left outline-none">
      <Card
        className={`
          h-full rounded-[16px] border p-6
          transition-all duration-200
          ${
            selected
              ? 'border-[#2F80ED] bg-blue-50/40 shadow-[0px_4px_20px_rgba(47,128,237,0.12)] ring-2 ring-[#2F80ED]/20'
              : 'border-[#E2E8F0] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:border-[#56CCF2] hover:shadow-[0px_6px_24px_rgba(47,128,237,0.08)]'
          }
        `}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`
              flex h-14 w-14 shrink-0 items-center justify-center
              rounded-2xl
              transition-all duration-200
              ${
                selected
                  ? 'bg-[#2F80ED] text-white shadow-sm'
                  : `${topicStyle.iconBg} ${topicStyle.iconColor} ${topicStyle.hoverBg}`
              }
            `}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>

          {/* Content */}
          <CardHeader className="min-w-0 flex-1 p-0">
            <CardTitle
              className={`
                text-base font-semibold
                ${selected ? 'text-[#2B4C7E]' : 'text-[#1E293B]'}
              `}
            >
              {title}
            </CardTitle>

            <CardDescription className="mt-1 text-sm leading-5 text-[#64748B]">
              {description}
            </CardDescription>
          </CardHeader>
        </div>
      </Card>
    </button>
  );
}
