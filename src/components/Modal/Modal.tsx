import {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import ModalBody from './ModalBody';
import ModalContext, { ModalContextValue } from './ModalContext';
import ModalFooter from './ModalFooter';
import ModalHeader from './ModalHeader';


export interface ModalProps extends PropsWithChildren {
  /**
   * When `true` The modal will show itself.
   */
  isOpen: boolean;

  /**
   * A callback fired when the header closeButton or non-static backdrop is clicked.
   */
  onClose: () => void;
  /**
   * A callback fires when the modal is open.
   */
  onOpen?: () => void;
  /**
   * Set custom modal with, if not provided will be used default values
   */
  width?: string;
  /**
   * Set custom modal height, if not provided will be used default values
   */
  height?: string;
  bgColor?: string;
}

const Modal: FC<ModalProps> = (props) => {
  const { isOpen, onClose, onOpen, children, width, height, bgColor } = props;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(isOpen);
  const [uniqueId, setUniqueId] = useState<string>(generateUniqueId());

  const modalRef = useRef<HTMLDivElement>(null);

  function generateUniqueId() {
    return 'ukey' + Math.random().toString(36).substring(2, 11);
  }

  const contextValue = useMemo<ModalContextValue>(() => {
    return {
      handleClose: onClose,
    };
  }, [onClose]);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
      onOpen?.();
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    onClose?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  if (!isModalOpen) return null;

  return ReactDOM.createPortal(
    <ModalContext.Provider value={contextValue}>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 overflow-y-auto">
            <div
              key={uniqueId}
              ref={modalRef}
              className="flex items-center justify-center min-h-screen p-6"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onKeyDown={handleKeyDown}
            >
              <div
                className="fixed inset-0"
                aria-hidden="true"
                onClick={closeModal}
              >
                <div className="absolute inset-0 bg-neutral-900 opacity-75"></div>
              </div>
              <div
                key={uniqueId}
                className={`
             text-white rounded-md text-left overflow-hidden z-50
            shadow-xl
            ${width ? width : 'sm:max-w-lg sm:w-full md:max-w-4xl'}
            ${height ? height : 'h-full max-h-[90vh]'}
            ${bgColor ? bgColor : 'bg-neutral-800'}
            `}
                role="document"
              >
                {children}
              </div>
            </div>
          </div>
        )}
    </ModalContext.Provider>,
    document.body,
  );
};

Modal.displayName = 'Modal';

export default Object.assign(Modal, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
