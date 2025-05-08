import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
} from "lucide-react";
import type { Pipeline } from "@/types/pipeline";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface PipelineCardProps {
  pipeline: Pipeline;
  onDelete?: (id: string) => void;
}

export function PipelineCard({ pipeline, onDelete }: PipelineCardProps) {
  const createdAt = new Date(pipeline.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const lastRun =
    pipeline.runs && pipeline.runs.length > 0
      ? new Date(pipeline.runs[pipeline.runs.length - 1].timestamp)
      : null;

  const lastRunFormatted = lastRun
    ? lastRun.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never run";

  return (
    <Card className="overflow-hidden" data-oid="duuusw7">
      <CardHeader
        className="pb-3 flex flex-row justify-between items-start"
        data-oid="10a-7_e"
      >
        <div className="flex-1" data-oid="grj-lwn">
          <CardTitle className="text-lg" data-oid="-37wxpq">
            {pipeline.name}
          </CardTitle>
          <CardDescription className="line-clamp-2" data-oid="1lvg2sj">
            {pipeline.description || "No description provided"}
          </CardDescription>
        </div>
        <DropdownMenu data-oid="::u5u26">
          <DropdownMenuTrigger asChild data-oid="hpv4.0i">
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              data-oid="lgxo5.z"
            >
              <MoreVertical className="h-5 w-5" data-oid="w6p0orw" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="db16zbw">
            <DropdownMenuItem
              onClick={() => onDelete && onDelete(pipeline.id)}
              className="text-red-600 focus:text-red-700"
              data-oid="94ep3ks"
            >
              <Trash2 className="mr-2 h-4 w-4" data-oid="yhclehg" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pb-2" data-oid="w-.2sq5">
        <div
          className="flex items-center gap-4 text-sm text-muted-foreground"
          data-oid="ex7wv2y"
        >
          <div className="flex items-center gap-1" data-oid="k-yhzx8">
            <Calendar className="h-3.5 w-3.5" data-oid="ie1s--6" />
            <span data-oid="jnfoenj">Created: {formattedDate}</span>
          </div>
          <div className="flex items-center gap-1" data-oid="vm3c7zt">
            <Clock className="h-3.5 w-3.5" data-oid="l.9rs-3" />
            <span data-oid="k9xbdmp">Last run: {lastRunFormatted}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2" data-oid="g59umtf">
        <Link
          href={`/dashboard/pipelines/${pipeline.id}`}
          className="w-full"
          data-oid="2b:t:.l"
        >
          <Button
            variant="outline"
            className="w-full justify-between"
            data-oid="08gv044"
          >
            View Pipeline
            <ArrowRight className="h-4 w-4" data-oid="l1caaq5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
