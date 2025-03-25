
import Login from "@/components/Login/Login";
import Content from "@/components/Content/Content";
import useAppStore from "@/store/store";


function App() {
    const {user, setUser} = useAppStore()

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