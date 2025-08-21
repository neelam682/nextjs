import React from 'react'
import Companionform from '@/components/companionform'

const NewComponion = () => {
    return (
        <main className='min-lg : w-2/3 min-md:w-2/3 items-center justify-center'>
            <article className='w-full gap-4 flex flex-col'>
                <h1>Companion Builder</h1>

                <Companionform />
            </article>
        </main>
    )
}

export default NewComponion