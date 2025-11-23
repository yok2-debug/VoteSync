
'use client';
import type { Voter, Election } from '@/lib/types';

interface VoterCardProps {
  voter: Voter & { followedElections?: Election[] };
}

const formatBirthDate = (dateString?: string): string => {
  if (!dateString || dateString.trim() === '') return '-';
  // Return as is, assuming it's in DD-MM-YYYY format from the source.
  return dateString;
};


export function VoterCard({ voter }: VoterCardProps) {
  return (
    <div
      style={{
        border: '1px solid black',
        padding: '8px',
        borderRadius: '4px',
        fontFamily: 'sans-serif',
        height: '6.6cm',
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
        <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '6px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '10px', fontWeight: 'bold', margin: 0 }}>Kartu Login Pemilih</h2>
        </div>
        <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>Nama Pemilih:</p>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: '600', wordBreak: 'break-word' }}>{voter.name}</p>
        </div>
        <div style={{ marginTop: '4px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>NIK:</p>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: '600', wordBreak: 'break-word' }}>{voter.nik || '-'}</p>
        </div>
        <div style={{ marginTop: '4px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>Tanggal Lahir:</p>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: '600', wordBreak: 'break-word' }}>{formatBirthDate(voter.birthDate)}</p>
        </div>
         <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#333' }}>Pemilihan yang Diikuti:</p>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8px', listStyle: 'disc' }}>
            {voter.followedElections && voter.followedElections.length > 0 ? (
                voter.followedElections?.map(election => (
                    <li key={election.id} style={{ marginBottom: '2px' }}>{election.name}</li>
                ))
            ) : (
                <li>(Tidak ada pemilihan yang diikuti)</li>
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
