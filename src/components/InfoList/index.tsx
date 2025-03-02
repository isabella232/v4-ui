import { ThemedClipSpinner, Tooltip } from '@pooltogether/react-components'
import FeatherIcon from 'feather-icons-react'
import classnames from 'classnames'
import { DetailedHTMLProps, HTMLAttributes } from 'react'

interface InfoListProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement> {
  bgClassName?: string
  textClassName?: string
}

export const ModalInfoList = (props: Omit<InfoListProps, 'bgClassName' & 'textClassName'>) => (
  <InfoList
    {...props}
    bgClassName='bg-white bg-opacity-20 dark:bg-actually-black dark:bg-opacity-10'
    textClassName=''
  />
)

export const InfoList = (props: InfoListProps) => {
  const { className, bgClassName, textClassName, ...ulProps } = props
  return (
    <ul
      {...ulProps}
      className={classnames(
        className,
        bgClassName,
        textClassName,
        'w-full px-4 py-2 rounded-lg transition'
      )}
    />
  )
}

InfoList.defaultProps = {
  bgClassName: 'bg-tertiary'
}

export interface InfoListItemProps {
  label: React.ReactNode
  value: React.ReactNode
  loading?: boolean
  labelToolTip?: React.ReactNode
  labelLink?: string
  dimValue?: boolean
  className?: string
  valueClassName?: string
  labelClassName?: string
  fontSizeClassName?: string
}

export const InfoListItem = (props: InfoListItemProps) => {
  const {
    label,
    value,
    loading,
    labelToolTip,
    labelLink,
    className,
    fontSizeClassName,
    dimValue,
    valueClassName,
    labelClassName
  } = props

  return (
    <li className={classnames('flex justify-between', className, fontSizeClassName)}>
      <div className={classnames('flex space-x-1 items-center', labelClassName)}>
        <span className='capitalize'>{label}</span>
        {labelToolTip && <Tooltip id={`info-item-${label}`} tip={labelToolTip} />}
        {labelLink && (
          <a
            href={labelLink}
            target='_blank'
            rel='noopener noreferrer'
            className='hover:opacity-50 transition-opacity'
          >
            <FeatherIcon icon='external-link' className='h-4 w-4' />
          </a>
        )}
      </div>
      <span className={classnames('text-right', valueClassName, { 'opacity-80': dimValue })}>
        {loading ? <ThemedClipSpinner sizeClassName='w-3 h-3' className='opacity-50' /> : value}
      </span>
    </li>
  )
}

InfoListItem.defaultProps = {
  fontSizeClassName: 'text-xxs xs:text-xs'
}

interface InfoListHeaderProps {
  label: React.ReactNode
  className?: string
  textColorClassName?: string
  textClassName?: string
}

export const InfoListHeader = (props: InfoListHeaderProps) => {
  const { label, className, textColorClassName, textClassName } = props
  return <li className={classnames(className, textColorClassName, textClassName)}>{label}</li>
}

InfoListHeader.defaultProps = {
  textClassName: 'font-semibold capitalize'
}
