"use client";

import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { approveRegistrationRequest, rejectRegistrationRequest } from '@/actions/tenant';
import { useTransition } from 'react';
import { toast } from '@/hooks/use-toast';

interface ApprovalActionsProps {
  requestId: string;
}

export function ApprovalActions({ requestId }: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRegistrationRequest(requestId);
      if (result.success) {
        toast({
          title: "Solicitud aprobada",
          description: "El negocio ha sido aprobado y el tenant ha sido creado.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo aprobar la solicitud.",
          variant: "destructive",
        });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectRegistrationRequest(requestId);
      if (result.success) {
        toast({
          title: "Solicitud rechazada",
          description: "La solicitud ha sido rechazada.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo rechazar la solicitud.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          aria-haspopup="true" 
          size="icon" 
          variant="ghost"
          disabled={isPending}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={handleApprove}
          disabled={isPending}
        >
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={handleReject}
          disabled={isPending}
        >
          Reject
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}