'use client';
import type { Voter } from '@/lib/types';

interface VoterCardProps {
  voter: Voter;
  categoryName: string;
}

export const VoterCard: React.FC<VoterCardProps> = ({ voter, categoryName }) => {
  return (
    <div className="card-wrapper bg-white text-black border border-gray-400 rounded-lg p-3 flex flex-col gap-2 text-[10px] leading-tight break-inside-avoid shadow-none w-[130mm] h-[80mm]">
      <div className="flex items-center gap-3 border-b-2 border-gray-400 pb-2 mb-2">
        <div className="w-16 h-16 flex-shrink-0">
          <img src="/logo-votesync.png" alt="VoteSync Logo" width="64" height="64" />
        </div>
        <div className="flex flex-col text-left">
          <h1 className="font-bold text-[14px] uppercase tracking-wider">Kartu Login Pemilih</h1>
          <h2 className="font-semibold text-[12px] uppercase">Sistem E-Voting VoteSync</h2>
        </div>
      </div>
      
      <div className="flex-grow grid grid-cols-2 gap-x-4">
        <div>
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
            <div className="font-semibold uppercase text-gray-600">Nama</div>
            <div className="font-bold text-lg uppercase leading-tight">{voter.name}</div>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-2 mt-1">
             <div className="font-semibold uppercase text-gray-600">TTL</div>
             <div className="font-semibold">{voter.birthPlace || '-'}, {voter.birthDate || '-'}</div>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-2 mt-1">
             <div className="font-semibold uppercase text-gray-600">Kategori</div>
             <div className="font-semibold">{categoryName}</div>
          </div>
        </div>
        <div className="border-l-2 border-dashed border-gray-300 pl-4 flex flex-col justify-center">
           <div className="space-y-2">
             <div>
                <div className="font-semibold uppercase text-gray-600">ID Pemilih</div>
                <div className="font-bold font-mono text-xl tracking-widest">{voter.id}</div>
             </div>
             <div>
                <div className="font-semibold uppercase text-gray-600">Password</div>
                <div className="font-bold font-mono text-xl tracking-widest">{voter.password}</div>
             </div>
           </div>
        </div>
      </div>

       <p className="text-center text-[8px] mt-2 italic border-t border-gray-300 pt-2">
        Simpan kartu ini dengan baik. Gunakan untuk login pada saat pemilihan berlangsung.
      </p>
    </div>
  );
};
