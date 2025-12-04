"use-client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Collapsible } from "./ui/collapsible";
import { Card } from "./ui/card";
import { Alert } from "./ui/alert";
import { MessageCircle, ChevronDown, ChevronRight, CornerDownRight, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  handle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

type CommentNode = Comment & {
  replies: CommentNode[];
}

type CommentSectionProps = {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {}