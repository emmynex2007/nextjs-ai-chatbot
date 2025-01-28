'use client';

import { useSession } from "next-auth/react"

export function TokenBalance() {
    const { data: session } = useSession();
    
    return (
        <span className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto">Remaining Token: {session?.user.llmToken}</span>
    )
}
