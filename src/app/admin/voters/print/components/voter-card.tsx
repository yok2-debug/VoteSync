
'use client';
import { Logo } from '@/components/logo';
import type { Voter } from '@/lib/types';

interface VoterCardProps {
  voter: Voter;
}

export function VoterCard({ voter }: VoterCardProps) {
  return (
    <div
      style={{
        border: '1px solid black',
        padding: '8px',
        borderRadius: '4px',
        fontFamily: 'sans-serif',
        height: '7.5cm',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pageBreakInside: 'avoid',
        backgroundColor: 'white',
        fontSize: '8px', // Reduced base font size
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid #ccc', paddingBottom: '6px' }}>
          <div style={{ transform: 'scale(0.7)'}}>
             <Logo />
          </div>
          <div>
            <h2 style={{ fontSize: '10px', fontWeight: 'bold', margin: 0 }}>VoteSync</h2>
            <p style={{ fontSize: '8px', color: '#666', margin: 0 }}>Kartu Login Pemilih</p>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>Nama Pemilih:</p>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: '600', wordBreak: 'break-word' }}>{voter.name}</p>
        </div>
         <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>Pemilu yang Diikuti:</p>
          <ul style={{ margin: 0, paddingLeft: '12px', fontSize: '8px', listStyle: 'disc' }}>
            {voter.followedElections && voter.followedElections.length > 0 ? (
                voter.followedElections.map(election => (
                    <li key={election.id} style={{ marginBottom: '2px' }}>{election.name}</li>
                ))
            ) : (
                <li>(Tidak ada pemilu yang diikuti)</li>
            )}
          </ul>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '2px', textAlign: 'center', marginTop: '8px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '8px', color: '#333' }}>Gunakan kredensial berikut untuk login:</p>
        <div style={{ marginTop: '4px' }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '600' }}>ID Pemilih:</span> 
            <span style={{ fontFamily: 'monospace', fontSize: '9px', marginLeft: '4px' }}>{voter.id}</span>
          </p>
          <p style={{ margin: '2px 0 0 0' }}>
            <span style={{ fontWeight: '600' }}>Password:</span> 
            <span style={{ fontFamily: 'monospace', fontSize: '9px', marginLeft: '4px' }}>{voter.password}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
