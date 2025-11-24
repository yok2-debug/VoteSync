'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import type { Election } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RealCountSettingsProps {
    elections: Election[];
}

export function RealCountSettings({ elections }: RealCountSettingsProps) {
    const [selectedElections, setSelectedElections] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const initialSelection: Record<string, boolean> = {};
        elections.forEach(election => {
            initialSelection[election.id] = election.showInRealCount || false;
        });
        setSelectedElections(initialSelection);
    }, [elections]);

    const handleSelectAll = (checked: boolean) => {
        const newSelection: Record<string, boolean> = {};
        elections.forEach(election => {
            newSelection[election.id] = checked;
        });
        setSelectedElections(newSelection);
    };

    const handleCheckboxChange = (electionId: string, checked: boolean) => {
        setSelectedElections(prev => ({
            ...prev,
            [electionId]: checked
        }));
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        try {
            const updates: Record<string, boolean | null> = {};
            elections.forEach(election => {
                const path = `/elections/${election.id}/showInRealCount`;
                const isSelected = selectedElections[election.id] || false;
                
                // Only update if there's a change to avoid unnecessary writes
                if (isSelected !== (election.showInRealCount || false)) {
                     updates[path] = isSelected;
                }
            });

            if (Object.keys(updates).length > 0) {
                 await update(ref(db), updates);
            }

            toast({
                title: 'Pengaturan Berhasil Disimpan',
                description: 'Tampilan halaman Real Count telah diperbarui.',
            });

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Gagal Menyimpan Pengaturan',
                description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const allChecked = elections.length > 0 && elections.every(e => selectedElections[e.id]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Tampilan Real Count</CardTitle>
                <CardDescription>Pilih pemilihan mana yang akan ditampilkan di halaman publik Real Count.</CardDescription>
            </CardHeader>
            <CardContent>
                {elections.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={allChecked}
                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                            />
                            <Label htmlFor="select-all" className="font-semibold">Pilih Semua Pemilihan</Label>
                        </div>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-1">
                            {elections.map((election) => (
                                <div key={election.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`election-${election.id}`}
                                        checked={selectedElections[election.id] || false}
                                        onCheckedChange={(checked) => handleCheckboxChange(election.id, Boolean(checked))}
                                    />
                                    <Label htmlFor={`election-${election.id}`} className="font-normal">{election.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">Tidak ada pemilihan yang tersedia untuk dikonfigurasi.</p>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                </Button>
            </CardFooter>
        </Card>
    );
}
