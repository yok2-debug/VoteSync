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
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        height: '10.5cm',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pageBreakInside: 'avoid',
        backgroundColor: 'white'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #ccc', paddingBottom: '12px' }}>
          <Logo />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>VoteSync</h2>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Kartu Login Pemilih</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#333' }}>Nama Pemilih:</p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>{voter.name}</p>
        </div>
         <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#333' }}>Pemilu yang Diikuti:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
            {voter.followedElections && voter.followedElections.length > 0 ? (
                voter.followedElections.map(election => (
                    <li key={election.id}>{election.name}</li>
                ))
            ) : (
                <li>Tidak ada pemilu yang diikuti</li>
            )}
          </ul>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#333' }}>Gunakan kredensial berikut untuk login:</p>
        <div style={{ marginTop: '8px' }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '600' }}>ID Pemilih:</span> 
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', marginLeft: '8px' }}>{voter.id}</span>
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            <span style={{ fontWeight: '600' }}>Password:</span> 
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', marginLeft: '8px' }}>{voter.password}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
