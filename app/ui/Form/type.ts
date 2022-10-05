export type MinimalInputProps = {
    onChange?: (...args: any[]) => void;
    onBlur?: (...args: any[]) => void;
    defaultValue?: any;
    defaultChecked?: boolean;
    name?: string;
    type?: string;
};