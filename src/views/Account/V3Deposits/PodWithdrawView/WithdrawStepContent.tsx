import { Amount, Token, Transaction } from '@pooltogether/hooks'
import {
  CheckboxInputGroup,
  ErrorsBox,
  SquareButton,
  SquareButtonTheme
} from '@pooltogether/react-components'
import FeatherIcon from 'feather-icons-react'
import { getMaxPrecision, numberWithCommas } from '@pooltogether/utilities'
import classnames from 'classnames'
import { BigNumber, ethers } from 'ethers'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { AmountBeingSwapped } from '@components/AmountBeingSwapped'
import { MaxAmountTextInputRightLabel } from '@components/Input/MaxAmountTextInputRightLabel'
import { TextInputGroup } from '@components/Input/TextInputGroup'
import { RectangularInput } from '@components/Input/TextInputs'
import { TxButtonNetworkGated } from '@components/Input/TxButtonNetworkGated'
import { ModalTitle } from '@components/Modal/ModalTitle'
import { ModalTransactionSubmitted } from '@components/Modal/ModalTransactionSubmitted'
import { TokenSymbolAndIcon } from '@components/TokenSymbolAndIcon'
import { getAmountFromString } from '@utils/getAmountFromString'
import { WithdrawalSteps } from '.'
import { DownArrow as DefaultDownArrow } from '@components/DownArrow'
import { V3PrizePool } from '@hooks/v3/useV3PrizePools'
import { AmountToReceive } from '@components/AmountToReceive'

const WITHDRAW_QUANTITY_KEY = 'withdrawal-quantity'

interface WithdrawStepContentProps {
  prizePool: V3PrizePool
  token: Token
  ticket: Token
  form: UseFormReturn<FieldValues, object>
  currentStep: WithdrawalSteps
  usersBalance: Amount
  withdrawTx: Transaction
  amountToWithdraw: Amount
  amountToReceive: Amount
  pricePerShare: Amount
  exitFee: BigNumber
  isExitFeeFetched: boolean
  isExitFeeFetching: boolean
  sendWithdrawTx: (e: any) => Promise<void>
  setWithdrawTxId: (txId: number) => void
  setCurrentStep: (step: WithdrawalSteps) => void
  setAmountToWithdraw: (amount: Amount) => void
  refetchBalances: () => void
  onDismiss: () => void
}

export const WithdrawStepContent = (props: WithdrawStepContentProps) => {
  const {
    prizePool,
    ticket,
    token,
    form,
    currentStep,
    withdrawTx,
    amountToWithdraw,
    amountToReceive,
    pricePerShare,
    usersBalance,
    exitFee,
    isExitFeeFetched,
    isExitFeeFetching,
    sendWithdrawTx,
    setWithdrawTxId,
    setCurrentStep,
    setAmountToWithdraw,
    refetchBalances,
    onDismiss
  } = props

  const { t } = useTranslation()

  const chainId = prizePool.chainId

  if (currentStep === WithdrawalSteps.viewTxReceipt) {
    return (
      <>
        <ModalTitle
          chainId={prizePool.chainId}
          title={t('withdrawalSubmitted', 'Withdrawal submitted')}
        />
        <ModalTransactionSubmitted
          className='mt-8'
          chainId={prizePool.chainId}
          tx={withdrawTx}
          closeModal={onDismiss}
          hideCloseButton
        />
      </>
    )
  }

  if (currentStep === WithdrawalSteps.review) {
    return (
      <>
        <ModalTitle chainId={chainId} title={t('withdrawTicker', { ticker: token.symbol })} />
        <WithdrawReviewStep
          prizePool={prizePool}
          chainId={chainId}
          amountToWithdraw={amountToWithdraw}
          amountToReceive={amountToReceive}
          token={token}
          ticket={ticket}
          tx={withdrawTx}
          exitFee={exitFee}
          isExitFeeFetched={isExitFeeFetched}
          isExitFeeFetching={isExitFeeFetching}
          sendWithdrawTx={sendWithdrawTx}
          setCurrentStep={setCurrentStep}
          setTxId={setWithdrawTxId}
          refetchBalances={refetchBalances}
        />
      </>
    )
  }

  return (
    <>
      <ModalTitle chainId={chainId} title={t('withdrawTicker', { ticker: token.symbol })} />
      <WithdrawInputStep
        chainId={chainId}
        form={form}
        token={token}
        ticket={ticket}
        balance={usersBalance}
        pricePerShare={pricePerShare}
        setCurrentStep={setCurrentStep}
        setAmountToWithdraw={setAmountToWithdraw}
      />
    </>
  )
}

interface WithdrawInputStepProps {
  chainId: number
  form: UseFormReturn<FieldValues, object>
  token: Token
  ticket: Token
  balance: Amount
  pricePerShare: Amount
  setCurrentStep: (step: WithdrawalSteps) => void
  setAmountToWithdraw: (amount: Amount) => void
}

/**
 * The first step in the withdrawal flow.
 * The user can input an amount & continue to the review page.
 * @param {*} props
 * @returns
 */
const WithdrawInputStep = (props: WithdrawInputStepProps) => {
  const {
    chainId,
    form,
    token,
    ticket,
    balance,
    pricePerShare,
    setCurrentStep,
    setAmountToWithdraw
  } = props

  const { t } = useTranslation()

  const {
    handleSubmit,
    formState: { isValid, isDirty, errors },
    watch
  } = form

  const amount = watch(WITHDRAW_QUANTITY_KEY)
  const amountToReceive = getAmountFromString(
    String(Number(amount) * Number(pricePerShare.amount)),
    token.decimals
  )

  const onSubmit = (data) => {
    const amount = data[WITHDRAW_QUANTITY_KEY]
    setAmountToWithdraw(getAmountFromString(amount, token.decimals))
    setCurrentStep(WithdrawalSteps.review)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <WithdrawForm chainId={chainId} form={form} token={token} ticket={ticket} balance={balance} />

      <DownArrow />

      <AmountToReceive chainId={chainId} amount={amountToReceive} token={token} />

      <ErrorsBox errors={isDirty ? errors : null} className='opacity-75' />

      <WithdrawWarning className='mt-2' />

      <SquareButton disabled={!isValid && isDirty} type='submit' className='w-full mt-8'>
        {t('reviewWithdrawal')}
      </SquareButton>
    </form>
  )
}

interface WithdrawReviewStepProps {
  prizePool: any
  chainId: number
  amountToWithdraw: Amount
  amountToReceive: Amount
  token: Token
  ticket: Token
  tx: Transaction
  exitFee: BigNumber
  isExitFeeFetched: boolean
  isExitFeeFetching: boolean
  sendWithdrawTx: (e: any) => Promise<void>
  setCurrentStep: (step: WithdrawalSteps) => void
  setTxId: (txId: number) => void
  refetchBalances: () => void
}

/**
 * The second step in the withdrawal flow.
 * The user can review their amount & send the transaction to their wallet.
 * @param {*} props
 * @returns
 */
const WithdrawReviewStep = (props: WithdrawReviewStepProps) => {
  const {
    prizePool,
    amountToWithdraw,
    amountToReceive,
    token,
    ticket,
    tx,
    sendWithdrawTx,
    exitFee,
    isExitFeeFetched,
    isExitFeeFetching
  } = props

  const { t } = useTranslation()

  const [exitFeeApproved, setExitFeeApproved] = useState<boolean>(false)

  const isTxInWallet = tx?.inWallet && !tx?.error && !tx.cancelled

  const isExitFeeAgreed = exitFee?.isZero() ? true : exitFeeApproved

  return (
    <div className='space-y-4'>
      <AmountBeingSwapped
        title={t('withdrawTicker', { ticker: ticket.symbol })}
        chainId={prizePool.chainId}
        from={ticket}
        to={token}
        amountFrom={amountToWithdraw}
        amountTo={amountToReceive}
      />

      <ExitFeeWarning
        exitFee={exitFee}
        token={token}
        exitFeeApproved={exitFeeApproved}
        setExitFeeApproved={setExitFeeApproved}
      />

      <TxButtonNetworkGated
        chainId={prizePool.chainId}
        toolTipId='withdrawal-tx'
        className='w-full'
        theme={SquareButtonTheme.orangeOutline}
        onClick={sendWithdrawTx}
        disabled={!isExitFeeFetched || isExitFeeFetching || !isExitFeeAgreed}
      >
        <span>{t('confirmWithdrawal')}</span>
      </TxButtonNetworkGated>
    </div>
  )
}

const ExitFeeWarning = (props: {
  token: Token
  exitFee: BigNumber
  exitFeeApproved: boolean
  setExitFeeApproved: (isApproved: boolean) => void
}) => {
  const { token, exitFee, exitFeeApproved, setExitFeeApproved } = props
  const { t } = useTranslation()

  if (!exitFee || exitFee.isZero()) {
    return null
  }

  return (
    <>
      <div className='bg-pt-red bg-opacity-50 dark:bg-opacity-80 p-4 rounded w-full mb-4'>
        <div className='flex justify-center'>
          <FeatherIcon icon='alert-triangle' className='w-4 h-4 mr-2 my-auto' />
          <span>
            {t('withdrawalFeeOfAmount', {
              amount: `${numberWithCommas(exitFee, { decimals: token.decimals })} ${token.symbol}`
            })}{' '}
            <a href='https://docs.pooltogether.com/protocol/prize-pool/fairness' target='_blank'>
              {t('learnMore')}
            </a>
            .
          </span>
        </div>
      </div>
      <div className='flex justify-center'>
        <CheckboxInputGroup
          large
          id='exit-fee-agreement-toggle'
          name='exit-fee-agreement-toggle'
          label={'I acknowledge that there is an exit fee'}
          checked={exitFeeApproved}
          handleClick={() => {
            setExitFeeApproved(!exitFeeApproved)
          }}
        />
      </div>
    </>
  )
}

const WithdrawLabel = (props) => {
  const { symbol } = props
  const { t } = useTranslation()
  return (
    <div className='font-inter font-semibold uppercase text-accent-3 opacity-60'>
      {t('withdrawTicker', { ticker: symbol })}
    </div>
  )
}

interface WithdrawFormProps {
  chainId: number
  form: UseFormReturn<FieldValues, object>
  balance: Amount
  token: Token
  ticket: Token
  disabled?: boolean
}

const WithdrawForm = (props: WithdrawFormProps) => {
  const { disabled, chainId, form, token, ticket, balance } = props
  const { register, setValue } = form

  const { symbol: ticketSymbol } = ticket

  const withdrawValidationRules = {
    isValid: (v) => {
      if (!v) return false
      const isNotANumber = isNaN(v)
      if (isNotANumber) return false
      const decimals = token.decimals
      if (getMaxPrecision(v) > Number(decimals)) return false
      const valueUnformatted = parseUnits(v, decimals)
      if (valueUnformatted.isZero()) return false
      if (valueUnformatted.lt(ethers.constants.Zero)) return false
      if (!balance || valueUnformatted.gt(balance.amountUnformatted)) return t('insufficientFunds')
      return true
    }
  }

  const { t } = useTranslation()

  return (
    <TextInputGroup
      unsignedNumber
      readOnly={disabled}
      Input={RectangularInput}
      symbolAndIcon={<TokenSymbolAndIcon chainId={chainId} token={ticket} />}
      validate={withdrawValidationRules}
      containerBgClassName={'bg-transparent'}
      containerRoundedClassName={'rounded-lg'}
      bgClassName={'bg-body'}
      placeholder='0.0'
      id={WITHDRAW_QUANTITY_KEY}
      name={WITHDRAW_QUANTITY_KEY}
      autoComplete='off'
      register={register}
      required={t('ticketQuantityRequired')}
      label={<WithdrawLabel symbol={ticket.symbol} />}
      rightLabel={
        <MaxAmountTextInputRightLabel
          valueKey={WITHDRAW_QUANTITY_KEY}
          setValue={setValue}
          tokenSymbol={ticketSymbol}
          amount={balance.amount}
          isAmountZero={!balance || balance.amountUnformatted.isZero()}
        />
      }
    />
  )
}

WithdrawForm.defaultProps = {
  disabled: false
}

const SquaredTokenAmountContainer = (props) => {
  const { chainId, amount, token } = props

  return (
    <div className='rounded-lg flex flex-row justify-between'>
      <TokenSymbolAndIcon chainId={chainId} token={token} />
      <span>{amount.amountPretty}</span>
    </div>
  )
}

SquaredTokenAmountContainer.defaultProps = {
  borderClassName: 'border-body'
}

const WithdrawWarning = (props) => {
  const { t } = useTranslation()

  return (
    <div
      className={classnames(
        'w-full py-1 px-4 text-xxs text-center rounded-lg bg-orange-darkened text-orange',
        props.className
      )}
    >
      {t(
        'withdrawingWillReduceYourOddsToWin',
        'Withdrawing funds will decrease your chances to win prizes!'
      )}
    </div>
  )
}

const DownArrow = () => <DefaultDownArrow className='my-2 text-inverse' />
