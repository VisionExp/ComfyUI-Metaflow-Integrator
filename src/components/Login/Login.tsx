import React, {useEffect, useState} from 'react';
import logoMetaflow from '../../assets/logoMFT.svg'


interface LoginProps {
    user: any
    setUser: (user: any) => void
}
/* eslint-disable-next-line */
export function Login(props: LoginProps) {
    const {user, setUser} = props
    const [email, setUserEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const handleSubmit = () => {

    }

    return (
        <div className={'flex items-center w-full justify-center'}>
            <div className={'max-w-[540px] w-full flex flex-col justify-center m-auto'}>
                <div className={'flex mt-8 flex-col text-center'}>
                    <div className={'mx-auto mb-4'}>
                        <img src={logoMetaflow} className="w-48 h-auto" alt='logo'/>
                    </div>
                    <h1 className={'text-2xl poppins-semibold '}>Welcome to Metaflow <br/> ComfyUI Adapter!</h1>
                    <p className={'mt-2 poppins-regular'}>Sign in to your account</p>
                </div>
                <div className={'mt-4'}>
                    <div className="mb-3">
                        <label
                            className="block mb-2 text-sm poppins-medium text-white"
                            htmlFor={'email'}
                        >
                            Email
                            <input
                                type="text"
                                id="email"
                                name="email"
                                required
                                onChange={(e) => setUserEmail(e.target.value)}
                                className="bg-neutral-600 border border-neutral-500 text-white text-sm rounded-lg block h-10 w-full px-2"
                            />
                        </label>
                    </div>
                    <div className="mb-3 relative">
                        <label
                            className="block mb-2 text-sm poppins-medium relative text-white"
                            htmlFor={'email'}
                        >
                            Password
                            <input
                                type={'text'}
                                id="password"
                                name="password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-neutral-600 border border-neutral-500 text-white text-sm rounded-lg
                     block h-10 w-full px-2"
                            />

                        </label>
                    </div>
                    <div onClick={handleSubmit} className={'mt-8 w-full flex '}>
                        <button className={"mx-auto w-64 bg-neutral-900"}>
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;