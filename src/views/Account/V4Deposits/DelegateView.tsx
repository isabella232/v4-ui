import {
  BlockExplorerLink,
  ModalTitle,
  SquareButton,
  SquareButtonTheme,
  ThemedClipSpinner,
  Collapse,
  SquareLink
} from '@pooltogether/react-components'
import FeatherIcon from 'feather-icons-react'
import classNames from 'classnames'
import { ethers } from 'ethers'
import { useState } from 'react'
import { FieldValues, useForm, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { PrizePool } from '@pooltogether/v4-client-js'
import { Transaction, useTransaction } from '@pooltogether/hooks'

import { useUsersAddress } from '@hooks/useUsersAddress'
import { useUsersTicketDelegate } from '@hooks/v4/PrizePool/useUsersTicketDelegate'
import { DepositItemsProps } from '.'
import { useUser } from '@hooks/v4/User/useUser'
import { useSendTransaction } from '@hooks/useSendTransaction'
import { InfoList } from '@components/InfoList'
import { TxReceiptItem } from '@components/InfoList/TxReceiptItem'
import { useIsWalletOnNetwork } from '@hooks/useIsWalletOnNetwork'
import { TxButtonNetworkGated } from '@components/Input/TxButtonNetworkGated'
import { getNetworkNameAliasByChainId } from '@pooltogether/utilities'

const DELEGATE_ADDRESS_KEY = 'delegate'

interface DelegateViewProps extends DepositItemsProps {}

enum DelegateViews {
  read = 'read',
  write = 'write'
}

export const DelegateView = (props: DelegateViewProps) => {
  const { prizePool } = props
  const { t } = useTranslation()
  const usersAddress = useUsersAddress()
  const { data: delegate, isFetched, refetch } = useUsersTicketDelegate(usersAddress, prizePool)
  const [view, setView] = useState<DelegateViews>(DelegateViews.read)

  return (
    <>
      <ModalTitle
        className='mb-4'
        chainId={prizePool.chainId}
        title={t('delegateDeposit', 'Delegate deposit')}
      />
      <p className='mb-2'>
        {t(
          'delegationExplainer1',
          'Delegation is a new feature that allows you to maintain full custody of your funds while allowing another wallet to have a chance to win prizes based on your deposit.'
        )}
      </p>
      <p className='mb-6'>
        {t(
          'delegationExplainer2',
          'You can still withdraw at any time. To to keep your chances of winning reset the delegate to your own address.'
        )}
      </p>
      {view == DelegateViews.read && (
        <DelegateReadState
          chainId={prizePool.chainId}
          isFetched={isFetched}
          usersAddress={usersAddress}
          delegate={delegate?.[usersAddress]}
          setWriteView={() => setView(DelegateViews.write)}
        />
      )}
      {view == DelegateViews.write && (
        <DelegateWriteState
          prizePool={prizePool}
          refetchDelegate={refetch}
          setReadView={() => setView(DelegateViews.read)}
        />
      )}
    </>
  )
}

interface DelegateReadStateProps {
  chainId: number
  isFetched: boolean
  usersAddress: string
  delegate: string
  setWriteView: () => void
}

const DelegateReadState = (props: DelegateReadStateProps) => {
  const { chainId, isFetched, setWriteView } = props

  const { t } = useTranslation()

  return (
    <div className='flex flex-col w-full'>
      <SquareLink
        href={`https://tools.pooltogether.com/delegate/?delegation_chain=${getNetworkNameAliasByChainId(
          chainId
        )}`}
        className='items-center space-x-2 mb-6'
      >
        <span>{t('delegateDeposit')}</span>
        <FeatherIcon icon='external-link' className='w-5 h-5' />
      </SquareLink>
      <Collapse title={'Advanced'} className='mx-auto'>
        <span className='text-xs opacity-70 font-bold'>
          {t('currentTicketDelegate', 'Current ticket delegate')}
        </span>
        <DelegateDisplay {...props} className='mb-4' />
        <SquareButton
          onClick={setWriteView}
          disabled={!isFetched}
          className='flex space-x-2 items-center'
        >
          <FeatherIcon icon='edit' className='w-5 h-5' />
          <span>{t('editTicketDelegate', 'Edit ticket delegate')}</span>
        </SquareButton>
      </Collapse>
    </div>
  )
}

interface DelegateDisplayProps {
  className?: string
  chainId: number
  isFetched: boolean
  usersAddress: string
  delegate: string
}

const DelegateDisplay = (props: DelegateDisplayProps) => {
  const { className, isFetched, chainId, usersAddress, delegate } = props

  const { t } = useTranslation()

  if (!isFetched) {
    return <ThemedClipSpinner className={className} sizeClassName='w-4 h-4' />
  } else if (delegate === ethers.utils.getAddress(usersAddress)) {
    return (
      <span className={classNames(className, 'text-sm')}>
        {t('self', 'Self')} (
        <BlockExplorerLink shorten chainId={chainId} address={delegate} className='text-sm' />)
      </span>
    )
  } else if (delegate === ethers.constants.AddressZero) {
    return <span className={classNames(className, 'text-sm')}>None</span>
  } else {
    return (
      <BlockExplorerLink
        chainId={chainId}
        address={delegate}
        className={classNames(className, 'text-sm')}
      />
    )
  }
}

interface DelegateWriteStateProps {
  prizePool: PrizePool
  refetchDelegate: () => void
  setReadView: () => void
}

const DelegateWriteState = (props: DelegateWriteStateProps) => {
  const { setReadView } = props
  const { t } = useTranslation()
  const [txId, setTxId] = useState(0)
  const tx = useTransaction(txId)

  return (
    <div className='flex flex-col w-full space-y-4'>
      <DelegateForm {...props} setTxId={setTxId} tx={tx} />
      {!tx?.sent && (
        <SquareButton theme={SquareButtonTheme.tealOutline} onClick={setReadView}>
          {t('cancel')}
        </SquareButton>
      )}
    </div>
  )
}

interface DelegateFormProps {
  prizePool: PrizePool
  tx: Transaction
  setTxId: (txId: number) => void
  refetchDelegate: () => void
}

export const DelegateForm = (props: DelegateFormProps) => {
  const { prizePool, refetchDelegate, setTxId, tx } = props

  const {
    handleSubmit,
    register,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange'
  })
  const { t } = useTranslation()
  const usersAddress = useUsersAddress()
  const sendTx = useSendTransaction()
  const user = useUser(prizePool)
  const isUserOnRightNetwork = useIsWalletOnNetwork(prizePool.chainId)

  const sendDelegateTx = async (x: FieldValues) => {
    const delegate = x[DELEGATE_ADDRESS_KEY]

    const txId = await sendTx({
      name: t('delegateDeposit', 'Delegate deposit'),
      method: 'delegate',
      callTransaction: () => user.delegateTickets(delegate),
      callbacks: {
        refetch: () => {
          refetchDelegate()
        }
      }
    })
    setTxId(txId)
  }

  const valitdationRules = {
    isValidAddress: (x: string) =>
      ethers.utils.isAddress(x) ? true : 'Please enter a valid address'
  }

  const errorMessage = errors?.[DELEGATE_ADDRESS_KEY]?.message

  if (tx?.inFlight || (tx?.completed && !tx?.error && !tx?.cancelled)) {
    return (
      <InfoList bgClassName='bg-body'>
        <TxReceiptItem depositTx={tx} chainId={prizePool.chainId} />
      </InfoList>
    )
  }

  return (
    <form onSubmit={handleSubmit(sendDelegateTx)} className='flex flex-col'>
      <button
        className='ml-auto mr-2 text-xs font-bold transition text-highlight-4 hover:opacity-70'
        type='button'
        onClick={() => {
          setValue(DELEGATE_ADDRESS_KEY, usersAddress)
          trigger(DELEGATE_ADDRESS_KEY)
        }}
      >
        {t('resetDelegate', 'Reset delegate')}
      </button>
      <Input inputKey={DELEGATE_ADDRESS_KEY} register={register} validate={valitdationRules} />
      <div className='h-8 text-pt-red text-center'>
        <span>{errorMessage}</span>
      </div>
      <TxButtonNetworkGated
        toolTipId='submit-new-delegate-tooltip'
        chainId={prizePool.chainId}
        className='w-full'
        type='submit'
        disabled={!isValid || !isUserOnRightNetwork}
      >
        {t('updateDelegate', 'Update delegate')}
      </TxButtonNetworkGated>
    </form>
  )
}

interface InputProps {
  inputKey: string
  register: UseFormRegister<FieldValues>
  validate: {
    [key: string]: (value: string) => boolean | string
  }
}

const Input = (props: InputProps) => {
  const { inputKey, register, validate } = props
  return (
    <div
      className={classNames(
        'p-0.5 bg-body rounded-lg overflow-hidden',
        'transition-all hover:bg-gradient-cyan focus-within:bg-pt-gradient',
        'cursor-pointer'
      )}
    >
      <div className='bg-body w-full rounded-lg flex'>
        <input
          className={classNames(
            'bg-transparent w-full outline-none focus:outline-none active:outline-none py-4 pr-8 pl-4 font-semibold'
          )}
          placeholder='0xabcde...'
          {...register(inputKey, { required: true, validate })}
        />
      </div>
    </div>
  )
}
