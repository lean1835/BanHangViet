import React from "react";
import {
  PhoneCall,
  MessageSquare,
  Mail,
  Clock,
  ExternalLink,
  Headphones,
} from "lucide-react";
import type { ISupportChannel, TSupportChannelType } from "../types/faqSupport.types";

interface SupportChannelsCardProps {
  channels?: ISupportChannel[];
  isLoading?: boolean;
}

const getChannelIcon = (type: TSupportChannelType) => {
  switch (type) {
    case "HOTLINE":
      return PhoneCall;
    case "ZALO":
      return MessageSquare;
    case "EMAIL":
      return Mail;
    case "WORKING_HOURS":
      return Clock;
    case "PORTAL":
    default:
      return ExternalLink;
  }
};

const getChannelAction = (channel: ISupportChannel) => {
  const cleanVal = channel.contactValue.replace(/\s+/g, "");
  switch (channel.channelType) {
    case "HOTLINE":
      return {
        href: `tel:${cleanVal}`,
        label: "Gọi ngay",
        altText: `Gọi Tổng đài: ${channel.contactValue}`,
        isLink: true,
      };
    case "ZALO":
      return {
        href: `https://zalo.me/${cleanVal}`,
        label: "Nhắn Zalo",
        altText: `Zalo: ${channel.contactValue}`,
        isLink: true,
      };
    case "EMAIL":
      return { href: `mailto:${cleanVal}`, label: "Gửi Email", altText: null, isLink: true };
    case "PORTAL":
      return { href: channel.contactValue, label: "Mở cổng", altText: null, isLink: true };
    case "WORKING_HOURS":
    default:
      return { href: null, label: null, altText: null, isLink: false };
  }
};

import { DEFAULT_SUPPORT_CHANNELS } from "../data/defaultFaqs";

export const SupportChannelsCard: React.FC<SupportChannelsCardProps> = ({
  channels = [],
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const rawList = channels.length > 0 ? channels : DEFAULT_SUPPORT_CHANNELS;
  const activeChannels = rawList.filter((c) => c.isActive !== false);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Headphones className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Kênh liên hệ
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Hỗ trợ trực tiếp
          </h3>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeChannels.map((channel) => {
          const Icon = getChannelIcon(channel.channelType);
          const action = getChannelAction(channel);

          return (
            <div
              key={channel.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200/80 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {channel.channelName}
                  </div>
                  <div className="text-xs font-medium text-blue-700 select-all">
                    {channel.contactValue}
                  </div>
                  {channel.description && (
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      {channel.description}
                    </div>
                  )}
                </div>
              </div>

              {action.isLink && action.href && (
                <a
                  href={action.href}
                  target={channel.channelType === "PORTAL" || channel.channelType === "ZALO" ? "_blank" : undefined}
                  rel={channel.channelType === "PORTAL" || channel.channelType === "ZALO" ? "noopener noreferrer" : undefined}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{action.label}</span>
                  {action.altText && <span className="sr-only">{action.altText}</span>}
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
