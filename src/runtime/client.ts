import type {
  AsyncData,
  AsyncDataOptions,
  KeyOfRes,
  PickFrom,
  _Transform,
} from 'nuxt/dist/app/composables/asyncData'
import type { ProcedureRecord, inferHandlerInput, inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import type { TRPCClientErrorLike } from '@trpc/client'
import { objectHash } from 'ohash'
import { useAsyncData, useState } from '#app'
import { useClient } from '#build/trpc-client'
import type { router } from '~/server/trpc'

type AppRouter = typeof router

type inferProcedures<
  TObj extends ProcedureRecord<any, any, any, any, any, any>,
> = {
  [TPath in keyof TObj]: {
    input: inferProcedureInput<TObj[TPath]>
    output: inferProcedureOutput<TObj[TPath]>
  };
}

type TQueries = AppRouter['_def']['queries']
type TError = TRPCClientErrorLike<AppRouter>

type TQueryValues = inferProcedures<AppRouter['_def']['queries']>

export async function useAsyncQuery<
  TPath extends keyof TQueryValues & string,
  TOutput extends TQueryValues[TPath]['output'] = TQueryValues[TPath]['output'],
  Transform extends _Transform<TOutput> = _Transform<TOutput, TOutput>,
  PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>,
>(
  pathAndInput: [path: TPath, ...args: inferHandlerInput<TQueries[TPath]>],
  options: AsyncDataOptions<TOutput, Transform, PickKeys> = {},
): Promise<AsyncData<PickFrom<ReturnType<Transform>, PickKeys>, TError>> {
  const client = useClient()
  const key = `${pathAndInput[0]}-${objectHash(pathAndInput[1] ? JSON.stringify(pathAndInput[1]) : '')}`
  const serverError = useState<TError | null>(`error-${key}`, () => null)
  const { error, data, ...rest } = await useAsyncData(
    key,
    () => client.query(...pathAndInput),
    options,
  )

  if (process.server && error.value && !serverError.value)
    serverError.value = error.value as any

  if (data.value)
    serverError.value = null

  return {
    ...rest,
    data,
    error: serverError,
  } as any
}