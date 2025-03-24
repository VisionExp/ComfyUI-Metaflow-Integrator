import {useEffect, useState} from 'react'
import Login from "@/components/Login/Login";
import Content from "@/components/Content/Content";


function App() {
    const [user, setUser] = useState<any>({})


    return (
        <div className='w-screen h-screen m-0'>
            {!user ? (
                <Login user={user} setUser={setUser}/>
            ) : (
                <Content />
            )}
        </div>
    )
}

export default App