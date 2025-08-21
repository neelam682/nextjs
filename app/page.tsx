import React from 'react'
import CompanionCard from '@/components/CompanionCard'
import CTA from '@/components/CTA'
import CompanionsList from '@/components/CompanionsList'
import { recentSessions } from '@/constants/index'


const Page = () => {
  return (
    <main>
      <h1 className='text-2xl underline'>Popular Companions</h1>

      <section className='home-section'>
        <CompanionCard
          id="123"
          name='Neura the Brainy Explorer'
          topic="Neural network of the Brain"
          subject="Science"
          duration={45}
          color="#ffda6e"
        />
        <CompanionCard
          id="456"
          name='Countesy the Number wizard'
          topic="Derivatives and Integrals"
          subject="Science"
          duration={30}
          color="#6dd89f"
        />
        <CompanionCard
          id="789"
          name='Verba the Wordsmith'
          topic="Language and Linguistics"
          subject="English Literature"
          duration={30}
          color="#82dee9"
        />
      </section>

      <section className='home-section'>
        <CompanionsList
          title="Recently completed sessions"
          companions={recentSessions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page
