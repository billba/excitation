import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Forms } from "./Forms";

@Entity()
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

    @CreateDateColumn('datetime')
    created_at!: Date;

    @UpdateDateColumn('datetime')
    modified_at!: Date;
}