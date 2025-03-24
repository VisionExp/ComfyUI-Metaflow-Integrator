import { FC, PropsWithChildren, useContext } from 'react';
import ModalContext from './ModalContext';
import Icon from "@mdi/react";
import {mdiWindowClose} from "@mdi/js";

export interface ModalHeaderProps extends PropsWithChildren {
  onClose?: () => unknown;
  bgColor?: string;
}

const ModalHeader: FC<ModalHeaderProps> = (props: ModalHeaderProps) => {
  const { children,  onClose, bgColor = true } = props;
  const { handleClose } = useContext(ModalContext);
  const close = () => {
    handleClose?.();
    onClose?.();
  };

  return (
    <div
      className={`flex justify-between items-center
      ${bgColor ? bgColor : 'bg-neutral-800'}
      border-b border-neutral-600`}
    >
      <h3 className="text-md px-4 font-medium">{children}</h3>
      <button
          type="button"
          onClick={close}
          className={`bg-transparent disabled:cursor-not-allowed disabled:text-gray-600 `}
      >
        <Icon path={mdiWindowClose} size={1} />
      </button>
    </div>
  );
};

ModalHeader.displayName = 'ModalHeader';


export default ModalHeader;
