'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { excluirEscritorioEDados, excluirMinhaConta } from '@/lib/actions/privacidade'

const CONFIRMACAO_CONTA = 'EXCLUIR MINHA CONTA'
const CONFIRMACAO_ESCRITORIO = 'EXCLUIR ESCRITORIO'

type Props = {
  podeExcluirEscritorio: boolean
}

export function ExclusaoDadosForm({ podeExcluirEscritorio }: Props) {
  const [confirmacaoConta, setConfirmacaoConta] = useState('')
  const [confirmacaoEscritorio, setConfirmacaoEscritorio] = useState('')
  const [pending, startTransition] = useTransition()

  function handleExcluirConta() {
    startTransition(async () => {
      const res = await excluirMinhaConta(confirmacaoConta)
      if (res?.erro) toast.error(res.erro)
    })
  }

  function handleExcluirEscritorio() {
    startTransition(async () => {
      const res = await excluirEscritorioEDados(confirmacaoEscritorio)
      if (res?.erro) toast.error(res.erro)
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Conforme o art. 18 da LGPD, você pode solicitar a exclusão dos seus dados pessoais.
        Recomendamos exportar um backup antes de prosseguir.
      </p>

      <Dialog>
        <DialogTrigger>
          <Button variant="outline" className="text-red-700 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Excluir minha conta
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir minha conta</DialogTitle>
            <DialogDescription>
              Remove seu acesso ao escritório e apaga sua conta de login. Esta ação é irreversível.
              Se você for o único sócio, use a exclusão do escritório.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-conta">
              Digite <span className="font-mono text-xs">{CONFIRMACAO_CONTA}</span> para confirmar
            </Label>
            <Input
              id="confirm-conta"
              value={confirmacaoConta}
              onChange={(e) => setConfirmacaoConta(e.target.value)}
              placeholder={CONFIRMACAO_CONTA}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={pending || confirmacaoConta !== CONFIRMACAO_CONTA}
              onClick={handleExcluirConta}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {podeExcluirEscritorio && (
        <Dialog>
          <DialogTrigger>
            <Button variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              Excluir escritório e todos os dados
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Direito ao esquecimento</DialogTitle>
              <DialogDescription>
                Apaga permanentemente o escritório, clientes, processos, documentos, financeiro e
                contas de todos os membros. Cancele assinaturas ativas antes, se necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              Esta operação não pode ser desfeita. Faça backup em JSON antes de continuar.
            </div>
            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-escritorio">
                Digite <span className="font-mono text-xs">{CONFIRMACAO_ESCRITORIO}</span> para confirmar
              </Label>
              <Input
                id="confirm-escritorio"
                value={confirmacaoEscritorio}
                onChange={(e) => setConfirmacaoEscritorio(e.target.value)}
                placeholder={CONFIRMACAO_ESCRITORIO}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={pending || confirmacaoEscritorio !== CONFIRMACAO_ESCRITORIO}
                onClick={handleExcluirEscritorio}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir tudo permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <p className="text-xs text-slate-500">
        Dúvidas ou solicitações manuais:{' '}
        <a href="mailto:dpo@jurivox.com.br" className="text-blue-600 hover:underline">
          dpo@jurivox.com.br
        </a>
      </p>
    </div>
  )
}
