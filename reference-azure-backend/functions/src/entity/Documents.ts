import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Forms } from "./Forms";

@Entity({
    name: 'documents',
    schema: 'dbo'
})
export class Documents {
    @PrimaryGeneratedColumn()
    document_id!: number;

    @ManyToOne((type) => Forms)
    @Column('int')
    form_id: number;

    @Column('text')
    name: string;

    @Column('text')
    pdf_url!: string;

    @Column('text')
    di_url: string;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}